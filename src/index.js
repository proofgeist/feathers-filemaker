
import makeDebug from 'debug';
import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
const fms = require('./fms/FMServerClient');
const Joi = require('joi');
const debug = makeDebug('fms');

debug('loading');

/**
 * cheap lodash
 * @type {{pick: (function(*, ...[*]))}}
 * @private
 */
const _ = {
  pick(source, ...keys) {
    const result = {};
    for(let key of keys) {
      result[key] = source[key];
    }
    return result;
  }
};


var optionsSchema = Joi.object().keys({
  model: Joi.object().required().keys({
    layout: Joi.string().required(),
    idField: Joi.string().default('id')
  }),
  paginate: Joi.object(),
  connection: Joi.object().required().keys({
    host: Joi.string().required(),
    db: Joi.string().required(),
    user: Joi.string().required(),
    pass: Joi.any().default('')
  }),
  scriptService: [Joi.object()],
  id: [Joi.string().default('id')]
});

class Service {
  constructor(options = {}) {

    const {value, error} = Joi.validate(options, optionsSchema);
    if(error){

      throw new Error(error);
    }

    this.paginate = options.paginate || {};
    this.connection = value.connection;
    this.model = value.model;
    this.id = this.model.idField; 

    fms.setURL(this.connection.host);
  }

  extend(obj) {
    return Proto.extend(obj, this);
  }

  fmsQuery(command, params){

    const db = params._db ? params._db :this.connection.db;
    const layout = params._lay ? params._lay : this.model.layout;

    return {
      '-db' : db,
      '-lay' : layout,
      [command] : ''
    };
  }

  fmsAuth(params){
    if(!params){
      params = {};
    }
    const auth = params.auth || {};
    return {
      user : auth.user || this.connection.user,
      pass : auth.pass || this.connection.pass
    };
  }

  buildGetOptions(qs, params){
    return {
      qs,
      method : 'get',
      auth : this.fmsAuth(params)
    };
  }

  buildPostOptions(qs, data, params){
    Object.assign(qs, data);
    const obj = {
      form: qs,
      method: 'post',
      auth : this.fmsAuth(params)
    };
    return obj;
  }

  handleFilters(obj, filters){
    if(filters.$limit){
      obj['-max']=filters.$limit;
    }
    if(filters.$skip){
      obj['-skip']=filters.$skip;
    }
    if(filters.$sort){
      const sortfFields = Object.keys(filters.$sort);
      sortfFields.map((key,i)=>{
        let n = i+1;
        let sortMethod =filters.$sort[key];

        let sortOrder = sortMethod === 1 ? 'ascend':   sortMethod === -1 ? 'descend' : sortMethod;
        obj['-sortfield.'+ n]=key;
        obj['-sortorder.'+ n]=sortOrder;
      });

    }
    return obj;
  }

  fmOperator (operator){
    switch (operator){
      case '$lt' :
        return 'lt';
      case '$lte' :
        return 'lte';
      case '$gt' :
        return 'gt';
      case '$gte' :
        return 'gte';
      case '$ne' :
        return 'neq';
      case 'cn' :
        return 'cn';
      default:
        return 'eq';
    }
  }

  expandQueryWithOperators (query){

    if(!query){
      return query;
    }
    let newQ = {};
    Object.keys(query).map((queryKey)=>{
      const queryItem = query[queryKey];

      if(queryKey.startsWith('$')){
        newQ = Object.assign(newQ , queryItem );// return with no change

      }else if( typeof queryItem !== 'object' ){
        newQ[queryKey] = queryItem; // rebuild the original
      }else{
        // theres an operator to add to the query
        const operator = Object.keys(queryItem)[0];
        const value = queryItem[operator];
        newQ[queryKey] = value;
        newQ[queryKey+'.op'] = this.fmOperator(operator);
      }
    });
    return newQ;

  }


  buildFindOptions(qs, params, filters){
    const query = params.query;
    let expandedQ = this.expandQueryWithOperators(query);
    let obj = Object.assign({}, qs, expandedQ);
    obj=this.handleFilters(obj, filters);

    return {
      qs : obj,
      method : 'get',
      auth : this.fmsAuth(params)
    };
  }

  buildOrFindOptions(qs, params, filters){
    const query = params.query;
    const orArray = query.$or;
    delete query.$or;

    const qArray = [];
    orArray.map((orCriteria, i)=>{
      let n = i + 1;
      //assuming one field in each Or
      let fieldName = Object.keys(orCriteria)[0];
      qArray.push('q'+n);
      query['-q'+n]=fieldName;
      query['-q'+n+'.value']=orCriteria[fieldName];
    });
    query['-query']='('+ qArray.join(');(')+ ')';



    let obj = Object.assign({}, qs, query);
    obj=this.handleFilters(obj, filters);
    return {
      qs : obj,
      method : 'get',
      auth : this.fmsAuth(params)
    };
  }



  // Find without hooks and mixins that can be used internally and always returns
  // a pagination object
  _find(params, getFilter=filter) {


    const query = params.query || {};

    const filters = getFilter(query);

    let options;
    if(query.$or){
      options = this.buildOrFindOptions(this.fmsQuery('-findquery', params), params, filters);
    }else{

      let command = Object.keys(query).length === 0 ? '-findall' : '-find';

      options = this.buildFindOptions(this.fmsQuery(command, params), params, filters);
    }

    let totalFound;

    return fms.request(options)

    //handle select
      .then((response)=>{
        totalFound = response.total;
        const result = response.data;
        if(filters.$select){

          return result.map((record)=>{
            return _.pick(record, ...filters.$select);
          });

        }
        return result;
      })


      .then((result)=>{

        return {
          total: totalFound,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data: result
        };
      });
  }

  find(params) {

    const handle401 = (data)=>{
      if(data.error==='401'){
        return [];
      }else{
        return data;
      }
    };

    // Call the internal find with query parameter that include pagination
    const result = this._find(params, query => filter(query, this.paginate));

    if(!this.paginate.default) {

      return result.then(page => page.data).then(handle401);
    }

    return result.then(handle401);

  }

  /**
   * private get to use internally
   * @param id
   * @returns {Promise.<TResult>}
   * @private
   */
  _get(id, params) {

    const qs = this.fmsQuery('-find', params);
    qs[this.model.idField]=id;
    qs[this.model.idField + '.op'] = 'eq';


    const options = this.buildGetOptions(qs, params);

    return fms.request(options).then((response)=>{
      const data = response.data;
      if(response.error!=='0'){
        if(response.error==='401'){
          throw new errors.NotFound('No record found for id \''+ id + '\'');
        }
        throw new errors.BadRequest('FMS error: ' + response.error);
      }
      return data[0];
    });
  }

  /**
   * public get
   * @param id
   */
  get(id, params){
    return this._get(id, params);
  }


  _create(data,params) {
    const qs = this.fmsQuery('-new', params);
    const options = this.buildPostOptions(qs, data, params);
    return fms.request(options).then((response)=>{
      const data = response.data;
      return data[0];
    });
  }

  create(data,params) {
    if(Array.isArray(data)) {
      return Promise.all(data.map(current => this._create(current, params)));
    }
    return this._create(data, params);
  }

  // Update without hooks and mixins that can be used internally
  _update(id, data, params) {

    return this.get(id, params)
      // find the record to get its record id
      .then((record)=>{
        const qs = this.fmsQuery('-edit', params);
        qs['-recid']=record.recid;
        return this.buildPostOptions(qs, data, params);
      })

      //update it
      .then((options)=>{
        return fms.request(options).then((response)=>{
         return response.data[0];
        });
      });


  }

  update(id, data, params) {
    if(id === null || Array.isArray(data)) {
      return Promise.reject(new errors.BadRequest(
        `You can not replace multiple instances. Did you mean 'patch'?`
      ));
    }

    return this._update(id, data, params);
  }

  // Patch without hooks and mixins that can be used internally
  _patch(id, data, params) {
    return this.get(id, params)
    // find the record to get its record id
      .then((record)=>{
        const qs = this.fmsQuery('-edit', params);
        qs['-recid']=record.recid;
        return this.buildPostOptions(qs, data,params);
      })

      //update it
      .then((options)=>{
        return fms.request(options).then((response)=>{
          return response.data[0];
        });
      });
  }

  patch(id, data, params) {
    if(id === null) {
      return this._find(params).then(page => {
        return Promise.all(page.data.map(
          current => this._patch(current[this.model.idField], data, params))
        );
      });
    }

    return this._patch(id, data, params);
  }

  _remove(id, params){

    let deletedRecord;

    return this.get(id,params)
      .then((record)=>{
        deletedRecord = record;
        const qs = this.fmsQuery('-delete', params);
        qs['-recid']=record.recid;
        return this.buildGetOptions(qs,params);

      })
      .then((options)=>{
        return fms.request(options).then(()=>{
          return deletedRecord;
          //  I need to deal with record locks etc here.
          /*const result = response.data
          if(result.error){
            // throw new errors.BadRequest(result.error)
          }else{
            return deletedRecord;
          };*/
        });
      });
  }

  remove(id, params){

    if(id && id.query){
      throw new errors.BadRequest('First parameter of remove() contained a \'query\' object. Did you mean to pass null?');
    }

    if(id === null) {
      return this._find(params)
        .then(page =>{

          return Promise.all(page.data.map(current => this._remove(current[this.model.idField], params )));
        });
    }

    return this._remove(id, params);
  }

  setup(app){
    this.app = app;
  }
}

export default function init(options) {
  return new Service(options);
}

init.Service = Service;
init.ScriptService = require('./script');
init.AutoService = require('./auto');

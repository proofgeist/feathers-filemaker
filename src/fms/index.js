"use strict";

const auth = require('feathers-authentication').hooks;
const ba = require('../../middleware/basic-auth');

const fms = require('./FMServerClient');
const transformers = require('./transformers')
const errors = require('feathers-errors');

fms.setURL('quest.geistinteractive.net');

const promiseToFindById = (params)=>{
  return fms.request(transformers.findByIDField(params, 'id'))
    .then((json)=>{
      if(json.error==="401"){
        throw new errors.NotFound('Record not found', {id: params.id})
      }
      return json
    })
};

const dbNamesService = {
  find : function(params){
    return fms.request(transformers.dbnames(params))
  }
};

const layoutNameService = {
  find : function (params){
    return fms.request(transformers.layoutnames(params))
  }
};

const tableService = {
  find : function (params){
    
    return fms.request(transformers.find(params))
  },


  get : function (id, params) {
    params.id = id;
    return promiseToFindById(params)
  },

  create :(data, params)=>{

    return fms.request(transformers.new(data, params))
  },

  remove : (id, params)=>{
    params.id = id;

    let deletedRecord;
    const returnDeletedRecord = (result)=>{
      if(result.error != '0'){
        throw new errors.Conflict(result.errorMessage, {id})
      }
      return deletedRecord
    };

    const deleteRec = (record)=>{
      deletedRecord = record;
      let id = deletedRecord.data[0].recid;
      params.id = id;
      return fms.request(transformers.delete(params, 'id'))
    };

    return promiseToFindById(params).then(deleteRec).then(returnDeletedRecord)
  },




};




module.exports = function() {
  const app = this;
  //app.use('/meta/dbnames', dbNamesService);
  app.use('/:db/:layout',ba(), tableService );

  const service = app.service('/data/:db/:layout');

  /*service.before(
    {all: [
      log,
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated()
    ]})*/

};

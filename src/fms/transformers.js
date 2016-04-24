'use strict'

/*
 functions that read the incoming request and transform it into an options object
 for a HTTP request for FM Server
 */

const Hoek = require('hoek');
const fmUtil = require('./FMServerClient/utilities');

/**
 *
 * @param request
 * @returns {{qs: {-dbnames: string}, method: string}}
 */
module.exports.dbnames = () => {
  return {
    qs: {'-dbnames' : ''},
    method : 'get',
    'auth': {
      'user': 'admin',
      'pass': ''
    }
  }
};

/**
 *
 * @param request
 * @returns {{-db: string, -layoutnames: string}}
 */
module.exports.layoutnames = (params)=>{
  return {
    qs : {
      '-db' : params.db,
      '-layoutnames' : ''
    },
    method : 'get',
    'auth': {
      'user': request.auth.credentials.username,
      'pass': request.auth.credentials.password,
    }
  }
}

/**
 *
 * @param request
 * @returns {{-db: string, -scriptnames: string}}
 */
module.exports.scriptnames = (request)=>{
  return {
    qs:{
      '-db' : request.params.db,
      '-scriptnames' : ''
    },
    method : 'get',
    'auth': {
      'user': request.auth.credentials.username,
      'pass': request.auth.credentials.password,
    }
  }
}

/**
 *
 * @param request
 * @returns {{-db: string, -lay: string}}
 */
module.exports.find = (params)=> {

  let obj = {
    '-db' : params.db,
    '-lay' : params.layout
  };
  if( !fmUtil.includesFields(params.query) ){
    obj['-findall'] = '';

  }else{
    obj['-find'] = '';
  }
  if(params.query != undefined && Object.keys(params.query).length != 0 ){
    Hoek.merge(obj, params.query );
  }

  let obj2 = {
    qs : obj,
    method : 'get',
    resolveWithFullResponse: true,
    simple: false,
    'auth': {
      'user': params.user.name,
      'pass': params.user.pass
    }
  };
  return obj2
};

module.exports.findByIDField = (params, IDField)=>{

  let obj = {
    '-db' : params.db,
    '-lay' : params.layout,
    '-find' : ''
  };

  obj[IDField] = params.id;
  obj[IDField + '.op'] = 'eq';
  obj = {
    qs : obj,
      method : 'get',
      resolveWithFullResponse: true,
      simple: false,
      'auth': {
      'user': params.user.name,
        'pass': params.user.pass
    }
  };

  return obj
};
/* $lab:coverage:on$ */
/**
 *
 * @param request
 * @returns {{-db: string, -lay: string, -recid: *}}
 */
module.exports.read = (params)=>{
  let obj = {
    '-db' : params.db,
    '-lay' : params.layout,
    '-recid' : params.id
  };
  obj = {
    qs : obj,
    method : 'get',
    resolveWithFullResponse: true,
    simple: false,
    'auth': {
      'user': params.user.name,
      'pass': params.user.pass
    }
  };
  return obj
};

/**
 *
 * @param request
 * @returns {{-db: *, -lay: *, -new: string}}
 */
module.exports.new = (data, params)=>{
  let obj = {
    '-db' : params.db,
    '-lay' : params.layout,
    '-new' : '',
  };
  Hoek.merge(obj, data );
  obj = {
    form : obj,
    method : 'post',
    resolveWithFullResponse: true,
    simple: false,
    'auth': {
      'user': params.user.name,
      'pass': params.user.pass
    }
  };
  return obj;
}

/**
 *
 * @param request
 * @returns {{-db: string, -lay: string, -edit: string, -recid: *, data: *}}
 */
module.exports.patch = (request)=>{
  let obj = {
    '-db' : request.params.db,
    '-lay' : request.params.layout,
    '-edit' : '',
    '-recid' : request.params.id
  };
  Hoek.merge(obj, request.payload );
  obj = {
    form : obj,
    method : 'post',
    'auth': {
      'user': request.auth.credentials.username,
      'pass': request.auth.credentials.password,
    }
  }
  return obj
};

/**
 *
 * @param request
 * @returns {{-db: string, -lay: string, -recid: *, -delete: string}}
 */
module.exports.delete = (params) => {
  let obj = {
    '-db' : params.db,
    '-lay' : params.layout,
    '-recid' : params.id,
    '-delete' : ''
  };
  obj = {
    form : obj,
    method : 'POST',
    resolveWithFullResponse: true,
    simple: false,
    'auth': {
      'user': params.user.name,
      'pass': params.user.pass
    }
  }
  return obj
};

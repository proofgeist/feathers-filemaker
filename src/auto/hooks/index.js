'use strict';


const hooks = require('feathers-hooks');

/*
websockets requires passing in path vars on the query
* so we move them off the query into the params
* this might
* */
const socketfix = (hook)=>{

  if(hook.params.provider === 'socketio'){

    if(hook.params.query._db){
      hook.params['_db']=hook.params.query._db;
      delete hook.params.query._db
    }

    if(hook.params.query._lay){
      hook.params['_lay']=hook.params.query._lay;
      delete hook.params.query._lay
    }
  }
};

exports.before = {
  all: [socketfix],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

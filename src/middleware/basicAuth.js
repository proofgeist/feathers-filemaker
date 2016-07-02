'use strict';
/**
 * Created by toddgeist on 7/1/16.
 */

const basicAuth = require('basic-auth');

module.exports = function(req, res, next){
  const user = basicAuth(req);
  if(user){
    req.feathers.auth = {
      user : user.name,
      pass : user.pass
    }
  }
  next();
};

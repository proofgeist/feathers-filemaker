'use strict';

const fmsService    = require('../index').default
const hooks         = require('./hooks');
const basicAuth     = require('../middleware/basicAuth')

/**
 * exposes a rest endoint for the entire server
 * @param options
 * @returns {Function}
 */
export default function(options){

  // if no prefix is provided add a default
  const prefix = options.prefix || 'auto';

  // if a model is not provided then add a default
  options.model = options.model || {layout: 'none'}

  options.connection.db = options.connection.db || 'NA';
  options.connection.user = options.connection.user || 'NA';
  options.connection.pass = options.connection.pass || 'passNA';

  return function(){

    const app = this;
    app.use(basicAuth);


    const restPath = '/'+prefix+'/:_db/:_lay';

    app.use( restPath, fmsService({
      model: options.model,
      connection: options.connection
    }));

    const Service = app.service(restPath);

    // we aren't really doing anything we these yet
    Service.before(hooks.before);
    Service.after(hooks.after);

  };
}

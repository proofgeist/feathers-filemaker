'use strict';
/**
 * Created by toddgeist on 4/23/16.
 */



const base = (params) => {
  return {
    '-db' : params.db,
    '-lay' : params.layout
  }
}



module.exports.findByIDField = (params, IDField)=>{

  let qs = base(params);
  qs['-find'] = ''

  qs[IDField] = params.id;
  qs[IDField + '.op'] = 'eq';


  const requestOptions = {
    qs ,
    method : 'get'
  }
  return requestOptions
};

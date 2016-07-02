'use strict';


/*
 A FileMaker Server Client based on request
 */

const rp = require('request-promise');
const formatterNew = require('./formaterWithValues');
const errors = require('feathers-errors');
const qs = require('querystring');



//const XML_END_POINT_OLD = '/fmi/xml/fmresultset.xml';
const XML_END_POINT = '/fmi/xml/FMPXMLRESULT.xml';


/**
 * default server address
 * @type {string}
 */
let server = 'localhost';


const handleHTTPResponse = (httpResponse)=>{
  if(httpResponse.statusCode === 401){
    throw new errors.NotAuthenticated('Invalid User name and or password');
  }else{
    return httpResponse.body;
  }
};


const convertToJSON = (xml)=>{

  if (xml === '') {
    throw new Error('FileMaker Server Web Publishing Engine may need to be restarted');
  }
  return formatterNew(xml);
};

const handleFileMakerErrors = (jsonResponse)=>{

  if(jsonResponse.name==='FileMakerServerError'){
    if(jsonResponse.error==='8003'){
      throw new errors.Conflict('FileMaker Server Error',jsonResponse);
    }else if(jsonResponse.error==='401'){
      //pass this back so the service can report error correctly
      return {
        total:0,
        error: '401',
        data :[]
      };
    }
  }
  return jsonResponse;
};

/**
 * makes a request to the server
 * @param options
 * @returns {Promise.<TResult>}
 */
module.exports.request = (options) =>{

  options.uri = 'https://' + server + XML_END_POINT;
  options.strictSSL=false;
  options.resolveWithFullResponse = true;
  options.simple = false;
 // console.log(options);

  /**
   * bad request error handler
   * we need this inline becuase we want to gather data about what the request was
   * so we need 'options' in scope.
   * @param jsonResponse
   * @returns {*}
   */
  const handleBadFileMakerServerRequest=(jsonResponse)=>{
    const getErrorData = ()=>{
      if(options.qs){
        return {
          method : options.method,
          url : options.uri + '?' + qs.stringify(options.qs)
        };
      }else {
        return {
          method : options.method,
          url : options.uri,
          postData : options.form
        };
      }

    };
    if(jsonResponse.name==='FileMakerServerError'){
      const message = 'FileMakerServerError: ' + jsonResponse.error + ', ' + jsonResponse.message;
      throw new errors.BadRequest( message ,getErrorData());
    }
    return jsonResponse;
  };



  return rp(options)
    .then(handleHTTPResponse)
    .then(convertToJSON)
    // .then(format) // not using now
    .then(handleFileMakerErrors)
    .then(handleBadFileMakerServerRequest);



};

/**
 * sets the address of the serverlocalhost:3030/db/kart_api/LicenseActivations
 * @param url
 */
module.exports.setURL = (url) =>{
  server = url;
};

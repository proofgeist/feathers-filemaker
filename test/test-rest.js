'use strict';
/**
 * Created by toddgeist on 6/30/16.
 */

const app = require('./test-app');
import assert from 'assert';


// Base Req for all tests
const rp = require('request-promise').defaults({
  baseUrl : 'http://' +process.env.FILEMAKER_SERVER_ADDRESS + ':3030/auto',
  auth: {
    user: 'admin',
    pass: 'admin'
  },
  simple: true,
  resolveWithFullResponse: true
});


const test = () =>{

  describe('GET', function(){
    describe('with wrong password', function(){
      it('should fail with a statusCode = 401', function(){
        return rp({
          method: "GET",
          uri : '/Test/Todos',
          auth : {
            user: 'admin',
            pass: 'wrong'
          }
        }).catch(result=>{
          assert.equal(result.statusCode, 401)
        })
      })
    });
    describe('with correct password', function(){
      it('should get statusCode 200', function(){
        return rp({
          method: "GET",
          uri : '/Test/Todos',
          auth : {
            user: 'admin',
            pass: 'admin'
          }
        }).then(result=>{
          assert.equal(result.statusCode, 200)
        })
      })
    });

    it( 'finds records' , function() {
      return rp({
        method: "GET",
        uri : '/Test/Todos',
        auth : {
          user: 'admin',
          pass: 'admin'
        },
        qs: {complete: 'false'}
      })
        .then(result=>{
          assert.ok(result.body.length > 0)
        })

    })

  });

  describe( 'POST' , function() {
    it('should create a record ' , function( ) {
      return rp({
        method: "POST",
        uri : '/Test/Todos',
        auth : {
          user: 'admin',
          pass: 'admin'
        },
        json : true,
        body : {text: 'okdokely', complete : false}
      })
        .then(result=>{
          assert.equal(result.body.text, 'okdokely')
        })
    })
  })

};

module.exports = {
  test
};

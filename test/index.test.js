/*jshint expr: true*/
require('dotenv').config({silent:true});
import { base, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import assert from 'assert';
import server from './test-app';
import hooks from 'feathers-hooks';
var fms = require('../lib');
var script = fms.ScriptService;



const connection = {
  host : process.env.FILEMAKER_SERVER_ADDRESS,
  db : 'Test',
  user: process.env.FILEMAKER_USER,
  pass: process.env.FILEMAKER_PASS
};

const model  = {
  layout : 'People'
};


const app = feathers();
app.configure(hooks());
app.use('/people', fms({
  model, connection
}));

// we configure a ScriptService and then retrieve it from the app
app.configure(script({connection, layout: 'Utility'}));
const ScriptService = app.service('fms-script-service');


const people = app.service('people');

app.setup();


const _ids = {};

describe('fms', () => {
  beforeEach(done => {
    people.create({
      name: 'Doug',
      age: 32
    }).then(data => {
      _ids.Doug = data.id;
      done();
    }, done);
  });

  afterEach(done => {
    const doneNow = () => done();
    people.remove(_ids.Doug).then(doneNow, doneNow);
  });
  it('is CommonJS compatible', () => {
    assert.equal(typeof require('../lib'), 'function');
  });


  base(people, _ids, errors);


});

describe('FMS service example test', function () {
  after(done => server.close(() => done()));

  example();
});

describe('ScriptService',function () {
  it('calls a script', function () {
    return ScriptService.run('TestScript', {message : 'ok'})
      .then(result=>{
        assert.ok(result.message);
      });
  });
});

describe('Issues', function () {
  describe('#5', function () {
    it('should not error when no records found' , function(  ) {
      return people.find({query: {name : 'no one named this'}}).then((result)=>{
        assert.ok(result.length===0);
        return result;
      });
    });

  });
});



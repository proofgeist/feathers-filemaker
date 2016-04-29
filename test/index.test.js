/*jshint expr: true*/
require('dotenv').config({silent:true});
import { base, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import assert from 'assert';
import server from './test-app';
var fms = require('../lib');


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
app.use('/people', fms({
  model, connection
}));


app.setup();
const people = app.service('people');

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



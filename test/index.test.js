/*jshint expr: true*/
import { base, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import assert from 'assert';
import server from './test-app';
var fms = require('../lib');


const connection = {
  host : 'quest.geistinteractive.net',
  db : 'Test',
  user: 'admin',
  pass: 'admin'
};

const model  = {
  layout : 'people'
};


const app = feathers()
app.use('/people', fms({
  model, connection
}));


const people = app.service('people');

const _ids = {}

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



  //base(people, _ids, errors);


});

describe('FMS service example test', () => {
  after(done => server.close(() => done()));

  example();
});


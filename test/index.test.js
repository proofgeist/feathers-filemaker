/*jshint expr: true*/
require('dotenv').config({silent:true});
import { base, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import assert from 'assert';
import server from './test-app';
import hooks from 'feathers-hooks';

let restTest = require('./test-rest').test;
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
const ScriptService = app.service('fms-Test-Utility-script');


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

describe('Live Server Tests', function () {
  after(done => server.close(() => done()));

  describe( "Adapter Example", function () {
    example();
  })

  describe( "REST Example", function () {
    restTest();
  })

});

describe('ScriptService',function () {
  it('calls a script', function () {
    return ScriptService.run('TestScript', {message : 'ok'})
      .then(result=>{
        assert.ok(result.message);
      });
  });
});

describe('if auth exist on params use it', function () {

  const auth = {user: 'second', pass: 'second'};

  const checkFor401 = (error)=>{
    assert.ok(error.code!==401);
  };

  // these may error, but as long as the error is not 401
  // we should be ok

  it('use it with find', function () {
    return people.find({auth}).catch(checkFor401);
  });

  it('use it with get', function () {
    return people.get(1, {auth}).catch(checkFor401);
  });

  it('use it with create', function () {
    return people.create({name:'joe'}, {auth}).catch(checkFor401);
  });

  it('use it with patch', function () {
    return people.patch(5736,{name:'s'}, {auth}).catch(checkFor401);
  });

  it('use it with update', function () {
    return people.update(5736, {}, {auth}).catch(checkFor401);
  });

  it('use it with remove', function () {
    return people.remove(1, {auth}).catch(checkFor401);
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

    describe( '#6 forgetting to pass null as first parem of remove' , function() {
      it('has a nice error', function () {
        return people.remove({query:{age:500}}).catch(err=>{
          assert.ok(err.toString().indexOf('BadRequest: First')===0);
          return 1;
        });
      });
    });

  });
});



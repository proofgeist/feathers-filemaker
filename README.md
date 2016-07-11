# fms

[![Build Status](https://travis-ci.org/f/f.png?branch=master)](https://travis-ci.org/f/f)

> A FileMaker Adapter For Feathers.js.

## About
This is a FileMaker Adapter for feathers.js. It makes it trivial to create a feathers service for any FileMaker Layout.  For non FileMaker people, a layout is a Table with a defined set of fields, and related records.

This currently passes all but two tests in the feathers-service-test suite. There is not an easy way to do a a true PUT, which would require nulling fields. When you PUT or in feathers terms 'update', you basically just get a PATCH. We also do not support the $in and $nin query filters.  We may in the future.  Support for $or is limited. Only single fields will work.

## Install

```bash
npm install feathers-filemaker --save
```
## Documentation

This adapter works like others Feathers Adapters. Please refer to the [Feathers database adapter documentation](http://docs.feathersjs.com/databases/readme.html) for more details or directly at:

- [Extending](http://docs.feathersjs.com/databases/extending.html) - How to extend a database adapter
- [Pagination and Sorting](http://docs.feathersjs.com/databases/pagination.html) - How to use pagination and sorting for the database adapter
- [Querying](http://docs.feathersjs.com/databases/querying.html) - The common adapter querying mechanism

### FileMaker Specific Configuration

This adapter takes two additional keys in it's configuration object: `connection`   and `model`


#### Connection

```js
  connection :{
    host : 'localhost',  // server address
    db : 'Contacts'
    user : 'admin'
    pass : 'pass'
  }
  ```

#### Model
 
  ```js
  model :{
    layout : 'Contacts' // the layout for the service
    idField : 'id'  // primary key field name, defaults to 'id'
 ```

Connection specifies the host, database, user, and password to connect to the database. model specifies the layout and idField to use for the feathers service.  See the complete example below for more information.


#### Script Service
There is also an included ScriptService that will run scripts on a specified layout. That layout must be based on a dedicated TO and Table.  The service creates a record in that table and dumps the data in a field before running the script. See the "Utility" Table and layout in the Test file. Add that table to your solution.  The records it creates are great for logging purposes.  But can be destroyed at will. 

The Service will return JSON as it normally does from the last layout it is on.  However if you end the script on 'Utility' layout, then it is smart enough to pull the result from the 'results' field. This lets you create custom responses with worrying about having a table to produce them from.  However the "result" will be parsed as JSON so you need to make sure it is valid JSON.

This is great for running transactions scripts!

#### Using the Script Service

```javascript
var fms = require('feathers-filemaker');
var script = fms.ScriptService;

// we configure a ScriptService, we need a connection, and a layout.
app.configure(script({connection, layout: 'Utility'}));

//...

// now later, anywhere we have access to the 'app' we can get the service.
// assuming connection to have a db named 'Test' and our layout was 'Utility'
const ScriptService = app.service('fms-Test-Utility-script');

// and use it like this.
ScriptService.run('ScriptName' , {any:'data', I: 'want'} ).then(handleResults)
```


## Complete Example

```javascript
var feathers = require('feathers');
var fms = require('feathers-filemaker');
var bodyParser = require('body-parser');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var mms = require('feathers-memory');

// Create a feathers instance.
const app = feathers()
  // Enable REST services
  .configure(rest())
  // Enable Socket.io services
  .configure(socketio())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({ extended: true }));

// create a FileMaker Service based on the Contacts Layout in the Contacts db
// paginate options can also be set here
app.use('/contacts', fms({
  connection :{
    host : 'localhost',
    db : 'Contacts'
    user : 'admin'
    pass : 'pass'
  },
  model :{
    layout : 'Contacts'
    idField : 'id'
  },
  paginate: {
    default: 2,
    max: 4
  }
}));


// Start the server.
var port = 3030;

app.listen(port, function() {
  console.log(`Feathers server listening on port ${port}`);
});
```
### Auto Service

EXPERIMENTAL - Use with caution.

In addition to setting up services using normal feathers idioms as described above, you can simply expose a RESTFUL endpoint to all the databases on the server. This is super simple to setup. It covers many of the common scenarios that REST is used for, however it is less powerful than normal feathers services.

The Auto Service serves a restful endpoint in the following form:

* `http://<address>:<port>/<prefix>/db/layout`
* `http://<address>:<port>/<prefix>/db/layout/id`

The prefix can be passed in as part of configuration. ( see below )

This will also work with WebSockets, but it's weird. And is currently doesn't have authentication. TODO:examples

### Authentication

Basic auth is the only option available to the Simple REST Service. JSONWeb Tokens currently won't work.

### Limitations

You can't use feathers hooks.

### How it works

You start by creating a normal feathers server. Then setup the Simple REST Server using configure()

Note: it takes the same options as a normal Feathers-FileMaker Service, plus one more "prefix" which is where the REST API is mounted ( See above )

Connection and model are the same with a regular Service, but some of the properties aren't used or are used only as defaults

* Connection.db is ignored
* Connection.user is a default, and is overridden by basic auth
* Connection.password is a default, and is overridden by basic auth
* Model.layout is ignored.

Example:

```javascript
// app.js of generated feathers app
const path = require('path');
const serveStatic = require('feathers').static;
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('feathers');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const bodyParser = require('body-parser');
const socketio = require('feathers-socketio');
const middleware = require('./middleware');
const services = require('./services');

//get SimpleRestService from feathers-filemaker
const fm = require('feathers-filemaker');
const SimpleRestService = fm.SimpleRESTService;

// you'll need a connection
const connection = {
  host : 'localhost',
  db : 'Test',  // ignored
  user : 'wrong',   // optional, overwritten by basic auth
  pass : 'wrong'    // optional, overwritten by basic auth
};

const app = feathers();

app.configure(configuration(path.join(__dirname, '..')));

app.use(compress())
  .options('*', cors())
  .use(cors())
  .use(favicon( path.join(app.get('public'), 'favicon.ico') ))
  .use('/', serveStatic( app.get('public') ))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
  .configure(rest())
  .configure(socketio())
  .configure(services)
  
  //configure SimpleRestService here
  .configure(SimpleRestService({
    connection,
    prefix : 'rest'

  }))
  
  // middleware should be last
  .configure(middleware);


module.exports = app;

```

## License

Copyright Todd Geist(c) 2016

Licensed under the [MIT license](LICENSE)

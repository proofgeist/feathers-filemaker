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
const ScriptService = app.service('fms-script-service');

// and use it like this.
ScriptService.run('ScriptName' , {any:'data', I: 'want'} ).then(handleResults)
```


## Complete Example

```javascript
var feathers = require('feathers');
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

## License

Copyright Todd Geist(c) 2016

Licensed under the [MIT license](LICENSE)

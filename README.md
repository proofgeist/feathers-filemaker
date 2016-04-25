# fms

[![Build Status](https://travis-ci.org/f/f.png?branch=master)](https://travis-ci.org/f/f)

> A FileMaker Adapter For Feathers.js.

## About
This is a FileMaker Adapter for feathers.js. It makes it trivial to create a feathers service for any FileMaker Layout.  For non FileMaker people, a layout is a Table with a defined set of fields, and related records.

This currently passes all but two tests in the feathers-service-test suite. There is not an easy way to do a a true POST, which would require nulling fields. When you POST, you basically just get a Patch. We also do not support the $in and $nin query filters.  We may in the future.  Support for $or is limited. Only single fields will work.

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

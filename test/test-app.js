require('dotenv').config({silent:true});
var feathers = require('feathers');
var bodyParser = require('body-parser');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var fms = require('../lib');
var AutoService = fms.AutoService;
const hooks = require('feathers-hooks');

const errorHandler = require('feathers-errors/handler');


const connection = {
  host : process.env.FILEMAKER_SERVER_ADDRESS,
  db : 'Test',
  user: process.env.FILEMAKER_USER,
  pass: process.env.FILEMAKER_PASS
};

const model  = {
  layout : 'Todos',
  idField : 'id'
};

// Create a feathers instance.
const app = feathers()
  .configure(hooks())
// Enable REST services
  .configure(rest())
  // Enable REST services
  .configure(socketio())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({ extended: true }))
  .configure( AutoService({
      connection,
      prefix : 'auto'
    }))
  .use(errorHandler());



// Create a service with a default page size of 2 items
// and a maximum size of 4
app.use('/todos', fms({
  connection, model,
  paginate: {
    default: 2,
    max: 4
  }
}));

// Start the server
module.exports = app.listen(3030);

console.log('Feathers Todo Filemaker service running on 127.0.0.1:3030');

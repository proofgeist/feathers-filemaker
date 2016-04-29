var feathers = require('feathers');
var bodyParser = require('body-parser');
var rest = require('feathers-rest');
var socketio = require('feathers-socketio');
var fms = require('../lib');

// Create a feathers instance.
const app = feathers()
// Enable REST services
  .configure(rest())
  // Enable REST services
  .configure(socketio())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({ extended: true }));


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


// Create an in-memory Feathers service with a default page size of 2 items
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

console.log('Feathers Todo memory service running on 127.0.0.1:3030');

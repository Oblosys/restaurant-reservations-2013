/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200
  , modelFileName = 'model/reservations.json'
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , express = require('express')  
  , Backbone = require('backbone')
  , app;

function writeError(res, nr, msg){
  res.writeHead(nr, {'Content-Type': 'text/plain'});
  res.write(msg);
  res.end();
}

// todo: still necessary?
process.on('uncaughtException', function(err) {
  // handle the error safely
  console.log(err);
});


var globalCounter = 0;

function readModel(type, id) {
  console.log('\nREAD: type:'+type+' id:'+id);
  return {id: id, name: "Pino "+type, date: "4-6-2013"};
}
function createModel(type, obj) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(obj));
  id = type+'-'+globalCounter++;
  console.log('fresh id:'+id);
  return {id: id};
}
function updateModel(type, id, obj) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(obj));
  return {};
}
function deleteModel(type, id) {
  console.log('\nDELETE: type:'+type+' id:'+id);
  return {};
}

app = express();
app.use(express.static(__dirname + '/../www'));
app.use(express.bodyParser());

app.get('/model/:type/:id', function(req, res) {
  res.send(readModel(req.params.type, req.params.id));
});
app.post('/model/:type', function(req, res) { 
  console.log(req.body);
  res.send(createModel(req.params.type, req.body));
});
app.put('/model/:type/:id', function(req, res) {
  res.send(updateModel(req.params.type, req.params.id, req.body));
});
app.del('/model/:type/:id', function(req, res) {
  res.send(deleteModel(req.params.type, req.params.id));
});

http.createServer(app).listen(portNr, function() {
  console.log('Server running at http://127.0.0.1:'+portNr+'/');
});

/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200
  , http     = require('http')
  , url      = require('url')
  , fs       = require('fs')
  , express  = require('express')  
  , _        = require('underscore')
  , Backbone = require('backbone')
  , db       = require('./db-mysql')
  , util     = require('./shared/util.js')
  , app;

function writeError(res, nr, msg){
  console.error('ERROR '+nr+': '+msg);
  res.writeHead(nr, {'Content-Type': 'text/plain'});
  res.write(msg);
  res.end();
}

// todo: still necessary?
process.on('uncaughtException', function(err) {
  // handle the error safely
  console.log(err);
});



function createApplication() {
  var app = express();

  app.use('/js', express.static(__dirname ));
  app.use(express.static(__dirname + '/../www'));
//  app.use(express.logger());
  app.use(express.bodyParser());

  app.get('/model/:type/:id', function(req, res) {
    db.readModel(res, req.params.type, req.params.id);
  });
  app.post('/model/:type', function(req, res) { 
    console.log(req.body);
    res.send(db.createModel(res, req.params.type, req.body));
  });
  app.put('/model/:type/:id', function(req, res) {
    res.send(db.updateModel(res, req.params.type, req.params.id, req.body));
  });
  app.del('/model/:type/:id', function(req, res) {
    res.send(db.deleteModel(res, req.params.type, req.params.id));
  });
  
  return app;
}

function createServer(app) {
  /*
  app.use(function(err, req, res, next) {
    // here we can handle exceptions, (function not called otherwise)
    // but the default behaviour seems just fine (send to console and as 500 response)
    res.send(500, 'error');
  });
  */

  http.createServer(app).listen(portNr, function() {
    console.log('Server running at http://127.0.0.1:'+portNr+'/');
  });
}


//todo: why module.exports?
exports = module.exports = createApplication;
exports.version = '0.1.0';
exports.createServer = createServer;
exports.db = db;
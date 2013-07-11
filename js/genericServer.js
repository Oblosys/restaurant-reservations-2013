/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , express = require('express')  
  , _ = require('underscore')
  , Backbone = require('backbone')
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


/* Basic CRUD server that stores models in root.<modelname>.models and keeps track of id counter */
var root = 
  { //reservation: { idCounter: 10, models: [{id: "reservation-1", name: "Pino", date: "4-6-2013"},{id: "reservation-2", name: "Tommie", date: "5-6-2013"}]}
  //, book:        { idCounter:100, models: [{id: "book-1", title: "Oblomov"},{id: "book-2", title: "War and peace"}]}            
  };

// todo: maybe create html errors? (need to pass res)

function readModel(type, id) {
  console.log('\nREAD: type:'+type+' id:'+id);
  
  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1)
      return models[0];
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
}

// todo: what if object already has an id?
function createModel(type, newModel) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(newModel));
  
  if (!root.hasOwnProperty(type))
    root[type] = {idCounter: 0, models: []};
  
  var id = type+'-'+root[type].idCounter++;
  console.log('fresh id:'+id);
  newModel.id = id;
  root[type].models.push(newModel);
  //console.log('root: '+JSON.stringify(root));
  return {id: id};
}

function updateModel(type, id, newModel) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(newModel));

  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models[ix] = newModel;
    }
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
  //console.log('root: '+JSON.stringify(root));
  return {};
}
function deleteModel(type, id) {
  console.log('\nDELETE: type:'+type+' id:'+id);

  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models.splice(ix,1);
    }
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
  //console.log('root: '+JSON.stringify(root));
  return {};
}


function createApplication() {
  var app = express();

  app.use('/js', express.static(__dirname ));
  app.use(express.static(__dirname + '/../www'));
//  app.use(express.logger());
  app.use(express.bodyParser());

  app.get('/model/:type/:id', function(req, res) {
    res.send(readModelSql(req.params.type, req.params.id));
  });
  app.post('/model/:type', function(req, res) { 
    console.log(req.body);
    res.send(createModelSql(req.params.type, req.body));
  });
  app.put('/model/:type/:id', function(req, res) {
    res.send(updateModelSql(req.params.type, req.params.id, req.body));
  });
  app.del('/model/:type/:id', function(req, res) {
    res.send(deleteModelSql(req.params.type, req.params.id));
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


function readModelSql(type, id) {
  console.log('\nREAD: type:'+type+' id:'+id);
  
  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1)
      return models[0];
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
}

// todo: what if object already has an id?
function createModelSql(type, newModel) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(newModel));
  
  if (!root.hasOwnProperty(type))
    root[type] = {idCounter: 0, models: []};
  
  var id = type+'-'+root[type].idCounter++;
  console.log('fresh id:'+id);
  newModel.id = id;
  root[type].models.push(newModel);
  //console.log('root: '+JSON.stringify(root));
  return {id: id};
}

function updateModelSql(type, id, newModel) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(newModel));

  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models[ix] = newModel;
    }
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
  //console.log('root: '+JSON.stringify(root));
  return {};
}
function deleteModelSql(type, id) {
  console.log('\nDELETE: type:'+type+' id:'+id);

  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models.splice(ix,1);
    }
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
  //console.log('root: '+JSON.stringify(root));
  return {};
}

//todo: why module.exports?
exports = module.exports = createApplication;
exports.version = '0.1.0';
exports.root = root;
exports.createServer = createServer;
exports.createModelSql = createModelSql;
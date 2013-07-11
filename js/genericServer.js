/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200
  , http =     require('http')
  , url =      require('url')
  , fs =       require('fs')
  , express =  require('express')  
  , _ =        require('underscore')
  , Backbone = require('backbone')
  , mysql =    require('mysql')
  , util =     require('./shared/util.js')
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
    readModelSql(res, req.params.type, req.params.id);
  });
  app.post('/model/:type', function(req, res) { 
    console.log(req.body);
    res.send(createModelSql(res, req.params.type, req.body));
  });
  app.put('/model/:type/:id', function(req, res) {
    res.send(updateModelSql(res, req.params.type, req.params.id, req.body));
  });
  app.del('/model/:type/:id', function(req, res) {
    res.send(deleteModelSql(res, req.params.type, req.params.id));
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


function connectAndUse(tableName) {
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'noneshallpass'
  });

  util.log('connecting');
  connection.connect();
  util.log('using '+tableName);
  connection.query('USE '+tableName);
  return connection;
}

function checkTableExistence(c, tableName, exists, notExists) {
  c.query('SHOW TABLES LIKE \''+tableName+'\'', function(err, rows) {
    if (err) throw err;

    if (rows.length == 1)
      exists();
    else
      notExists();
  });
}

// todo: init database when nonexistent
// todo: find nice way to express continuation stuff with mysql (check internet)
// todo: varchar size. fix in ui
// todo case sensitivity: either use case sensitive, or convert types to lowercase
// todo adapt json version for contiuation based results
// todo: also for json version
// todo: Fix this error:   [Error: Can't set headers after they are sent.]
function resetDb() {
  var c = connectAndUse('ReservationsDb');
  c.query('DROP TABLE Reservation', function(err, result) {
    if (err) throw err;
    c.query('CREATE TABLE Reservation (id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (id),name VARCHAR(20), nrOfPeople SMALLINT, date VARCHAR(10), time VARCHAR(5), comment VARCHAR(200));', function(err, result) {
      if (err) throw err;
    });
    
  });
  c.end();
}

// todo: also for json
function getAllModels(type, success) {
  var c = connectAndUse('ReservationsDb');
  
  // NOTE: use connection.escape for user-provided data to prevent SQL injection attacks, or use '?' (does it automatically)
  // connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, results) {
  var queryStr = 'SELECT * FROM '+type;
  c.query(queryStr, function(err, rows, fields) {
    if (err) throw err;
    util.log('SQL output for '+queryStr+' ('+rows.length+' lines)');
    success(rows);
  });  
  c.end();
}
// TODO: escaping + check if table exists
function readModelSql(res, type, id) {
  console.log('\nREAD: type:'+type+' id:'+id);
  var c = connectAndUse('ReservationsDb');
  
  checkTableExistence(c, type, 
      function(){
        // NOTE: use connection.escape for user-provided data to prevent SQL injection attacks, or use '?' (does it automatically)
        // connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, results) {
        var queryStr = 'SELECT * FROM '+type+' WHERE id='+id;
        c.query(queryStr, function(err, rows, fields) {
          if (err) throw err;
          util.log('SQL output for '+queryStr+' ('+rows.length+' lines)');
          if (rows.length==1) {
            res.send(rows[0]);
          }
          else if (rows.length<1)
            writeError(res, 404,'Unknown id: '+id+' for type \''+type+'\'');
          else
            writeError(res, 500,'Multiple ids: '+id+' for type \''+type+'\''); // won't occur, because of PRIMARY KEY constraint
          c.end();
        });      
      },
      function(){
        writeError(res, 404,'Unknown type \''+type+'\'');
        c.end();
      } );
}

// todo: what if object already has an id?
function createModelSql(res, type, newModel) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(newModel));
  
  var c = connectAndUse('ReservationsDb');
  
  checkTableExistence(c, type, 
    function(){
      c.query('INSERT INTO '+type+' SET ?', newModel, function(err, result) {
        if (err) throw err;

        if (res)
          res.send({id: result.insertId});
      });
      c.end();
    },
    function(){
      writeError(res, 404,'Unknown type \''+type+'\'');
      c.end();
    });
  
}

function updateModelSql(res, type, id, newModel) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(newModel));

  var c = connectAndUse('ReservationsDb');
  
  checkTableExistence(c, type, 
    function(){
      var newModelNoId = _.clone(newModel);
      delete newModelNoId.id;
      c.query('UPDATE '+type+' SET ? WHERE id='+id, newModelNoId, function(err, result) {
        if (err) throw err;

        for (var i=0; i<result.length; i++)
          util.log(result[i]);

        if (res)
          res.send({});
      });
      c.end();
    },
    function(){
      writeError(res, 404,'Unknown type \''+type+'\'');
      c.end();
    });
}
function deleteModelSql(res, type, id) {
  console.log('\nDELETE: type:'+type+' id:'+id);

  var c = connectAndUse('ReservationsDb');

  checkTableExistence(c, type, 
      function(){

      var queryStr = 'DELETE FROM '+type+' WHERE id='+id;
        c.query(queryStr, function(err, rows, fields) {
          if (err) throw err;
          util.log('SQL output for '+queryStr+' ('+rows.length+' lines)');
          if (rows.length==1) {
            res.send(rows[0]);
          }
          else if (rows.length<1)
            writeError(res, 404,'Unknown id: '+id+' for type \''+type+'\'');
          else
            writeError(res, 500,'Multiple ids: '+id+' for type \''+type+'\''); // won't occur, because of PRIMARY KEY constraint
          c.end();
        });      
      },
      function(){
        writeError(res, 404,'Unknown type \''+type+'\'');
        c.end();
      } );
}
/*
//DROP TABLE Reservation;
DROP DATABASE ReservationsDb;
CREATE DATABASE ReservationsDb;
USE ReservationsDb;

DROP TABLE Reservation;
CREATE TABLE Reservation (id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (id),name VARCHAR(20), nrOfPeople SMALLINT, date VARCHAR(10), time VARCHAR(5), comment VARCHAR(200));
INSERT INTO Reservation SET name='Martijn', nrOfPeople='3', date='11-7-2013', time='20:00';
INSERT INTO Reservation SET name='Pino', nrOfPeople='2', date='11-7-2013', time='21:00';

 */

//todo: why module.exports?
exports = module.exports = createApplication;
exports.version = '0.1.0';
exports.root = root;
exports.createServer = createServer;
exports.resetDb = resetDb;
exports.getAllModels = getAllModels;
exports.createModelSql = createModelSql;
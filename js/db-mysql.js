var _        = require('underscore')
  , mysql    = require('mysql')
  , util     = require('./shared/util.js');



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
function readModel(res, type, id) {
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
function createModel(res, type, newModel) {
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

function updateModel(res, type, id, newModel) {
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
function deleteModel(res, type, id) {
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

exports.resetDb = resetDb;
exports.getAllModels = getAllModels;
exports.createModel = createModel;
exports.readModel = readModel;
exports.updateModel = updateModel;
exports.deleteModel = deleteModel;
var _        = require('underscore')
  , mysql    = require('mysql')
  , util     = require('./shared/util.js');

var dbInfo = { // default values, override these in server module
    host     : 'localhost',
    user     : 'root',
    password : '',
    name     : 'nodeserver_db'
};

var changeHandler = null;

//todo: init database when nonexistent
//todo: give error when model type is not found? in json we should just return empty. makes sense for lists (not for readModel)
//todo: use object also for other params beside continuations? {type=.., id=} might be good since we don't call them often in the code so not much extra typing
//todo: express checkTableExistence with continuations
//todo: varchar size. fix in ui
//todo case sensitivity: either use case sensitive, or convert types to lowercase
//todo: Fix this error:   [Error: Can't set headers after they are sent.]



function connect() {
  var connection = mysql.createConnection({
    host     : dbInfo.host,
    user     : dbInfo.user,
    password : dbInfo.password
  });

  //util.log('connecting');
  connection.connect();
  return connection;
}

function initDb() {
  var connection = connect();
  connection.query('CREATE DATABASE IF NOT EXISTS '+dbInfo.name);
}


function onChange(newChangeHandler) {
  changeHandler = newChangeHandler;
}

function dbChanged() {
  if (changeHandler)
    changeHandler();
}

function connectAndUse() {
  var connection = connect();
  connection.query('USE '+dbInfo.name);
  return connection;
}

function createTableIfNotExists(c, tableName) {
  c.query('CREATE TABLE '+tableName+' (id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (id),name VARCHAR(20), nrOfPeople SMALLINT, date VARCHAR(10), time VARCHAR(5), comment VARCHAR(200));', function(err, result) {
    if (err) throw err;
  });
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

function resetDb(cont) {
  var c = connectAndUse();
  c.query('DROP TABLE IF EXISTS reservation', function(err, result) {
    //util.log('dropped');
    if (err) throw err;
    
    c.query('CREATE TABLE reservation (id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (id),name VARCHAR(20), nrOfPeople SMALLINT, date VARCHAR(10), time VARCHAR(5), comment VARCHAR(200));', function(err, result) {
      //util.log('created');
      if (err) throw err;
      c.end();
      if (cont) {
        cont();
      }
    });
  });
  dbChanged();
}

function getAllModels(type, cont) {
  var c = connectAndUse();
  
  // NOTE: use connection.escape for user-provided data to prevent SQL injection attacks, or use '?' (does it automatically)
  // connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, results) {
  var queryStr = 'SELECT * FROM '+type;
  c.query(queryStr, function(err, rows, fields) {
    if (err) throw err;
    util.log('SQL output for '+queryStr+' ('+rows.length+' lines)');
    cont.success(rows);
  });  
  c.end();
}
// todo: incorrect id for read does not call error
// todo: call cont.err instead of throw
// TODO: escaping + check if table exists
function readModel(type, id, cont) {
  console.log('\nREAD: type:'+type+' id:'+id);
  var c = connectAndUse();
  
  checkTableExistence(c, type, 
      function(){
        // NOTE: use connection.escape for user-provided data to prevent SQL injection attacks, or use '?' (does it automatically)
        // connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, results) {
        var queryStr = 'SELECT * FROM '+type+' WHERE id='+id;
        c.query(queryStr, function(err, rows, fields) {
          if (err) throw err;
          util.log('SQL output for '+queryStr+' ('+rows.length+' lines)');
          if (rows.length==1) {
            cont.success(rows[0]);
          }
          else if (rows.length<1)
            cont.error(404,'Unknown id: '+id+' for type \''+type+'\'');
          else
            cont.error(500,'Multiple ids: '+id+' for type \''+type+'\''); // won't occur, because of PRIMARY KEY constraint
          c.end();
        });      
      },
      function(){
        cont.error(404,'Unknown type \''+type+'\'');
        c.end();
      } );
}

// todo: what if object already has an id?
function createModel(type, newModel, cont) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(newModel));
  
  var c = connectAndUse();
  
  checkTableExistence(c, type, 
    function(){
      var queryStr = 'INSERT INTO '+type+' SET ?';
      c.query(queryStr, newModel, function(err, result) {
        if (err) throw err;

        if (cont.success) {
          dbChanged();
          cont.success({id: result.insertId});
        }
      });
      c.end();
    },
    function(){
      cont.error(404,'Unknown type \''+type+'\'');
      c.end();
    });
}

function updateModel(type, id, newModel, cont) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(newModel));

  var c = connectAndUse();
  
  checkTableExistence(c, type, 
    function(){
      var newModelNoId = _.clone(newModel);
      delete newModelNoId.id;
      var queryStr = 'UPDATE '+type+' SET ? WHERE id='+id;
      c.query(queryStr, newModelNoId, function(err, result) {
        if (err) throw err;

        if (cont.success) {
          dbChanged();
          cont.success({});
        }
      });
      c.end();
    },
    function(){
      cont.error(404,'Unknown type \''+type+'\'');
      c.end();
    });
}

function deleteModel(type, id, cont) {
  console.log('\nDELETE: type:'+type+' id:'+id);

  var c = connectAndUse();

  checkTableExistence(c, type, 
      function(){

      var queryStr = 'DELETE FROM '+type+' WHERE id='+id;
        c.query(queryStr, function(err, result) {
          if (err) throw err;
          
          if (cont.success) {
            dbChanged();
            cont.success(); // delete doesn't return anything
          }
          c.end();
        });      
      },
      function(){
        cont.error(404,'Unknown type \''+type+'\'');
        c.end();
      } );
}
/*
//DROP TABLE reservation;
DROP DATABASE reservations_db;
CREATE DATABASE reservations_db;
USE ReservationsDb;

DROP TABLE reservation;
CREATE TABLE reservation (id INT NOT NULL AUTO_INCREMENT, PRIMARY KEY (id),name VARCHAR(20), nrofpeople SMALLINT, date VARCHAR(10), time VARCHAR(5), comment VARCHAR(200));
INSERT INTO reservation SET name='Martijn', nrOfPeople='3', date='11-7-2013', time='20:00';
INSERT INTO reservation SET name='Pino', nrOfPeople='2', date='11-7-2013', time='21:00';


grant select on reservations_db for guest users:
GRANT SELECT ON reservations_db.* TO 'guest'@'%' IDENTIFIED BY 'welcome';
they can access the db with:
mysql -u guest --password=welcome -h server.oblomov.com reservations_db
 */

exports.dbInfo = dbInfo;
exports.initDb = initDb;
exports.onChange = onChange;
exports.resetDb = resetDb;
exports.getAllModels = getAllModels;
exports.createModel = createModel;
exports.readModel = readModel;
exports.updateModel = updateModel;
exports.deleteModel = deleteModel;
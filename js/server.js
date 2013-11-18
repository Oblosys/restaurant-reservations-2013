/**
 * Web server for reservations app
 */


var restaurantInfo = { maxNrOfPeople: 12 };

var _ =             require('underscore')
  , Backbone =      require('backbone')
  , mysql =         require('mysql')
  , util =          require('./shared/util.js')
  , genericServer = require('./genericServer.js')
  , socketIO =      require('socket.io')
  , app;

genericServer.db.dbInfo.host = 'localhost';
genericServer.db.dbInfo.user = 'root';
genericServer.db.dbInfo.password = 'noneshallpass';
genericServer.db.dbInfo.name = 'reservations_db';

app = genericServer();


var someReservations =
  [  [ { time:'20:00', name:'Nathan', nrOfPeople:2, comment:'Nathan says hi' }
     , { time:'20:00', name:'Tommy', nrOfPeople:3, comment:'' }
     , { time:'20:00', name:'Paul', nrOfPeople:2, comment:'' }
     , { time:'20:30', name:'Bridget', nrOfPeople:3, comment:'' }
     , { time:'20:30', name:'Nicole', nrOfPeople:4, comment:'' }
     , { time:'22:00', name:'Ann', nrOfPeople:8, comment:'' }
     ]
   , [ { time:'21:00', name:'Charlie', nrOfPeople:8, comment:'Dinner at nine' } 
     ]
   , [ { time:'20:00', name:'Frank', nrOfPeople:8, comment:'' } 
     ]
   , [ { time:'18:00', name:'Sam', nrOfPeople:3, comment:'Would like the special menu' } 
     ]
   , []
   ];

function makeLotOfReservations(n) {
  var d = new Date();
  d.setDate( d.getDate() - 15 );
  var templatess = _.flatten(util.replicate(n,someReservations), true); // array of arrays (lists of reservations per day)
  var reservations = [];
  var id = 0;
  for (var i=0; i<templatess.length; i++) {
    for (var j=0; j<templatess[i].length; j++) {
      var reservation = _.clone(templatess[i][j]);
      reservation.id=id++;
      reservation.date=util.showDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()+i));
      reservations.push(reservation);
    }
  }
  return reservations;
}

function initDb() {
  util.log('initDb');
  // todo: clear db
  genericServer.db.resetDb( function() {
    // TODO: creates lot of connections, and fails if argument is too large
    var lotOfReservations = makeLotOfReservations(15);

    for (var i=0; i<lotOfReservations.length; i++) {
      genericServer.db.createModel('reservation', lotOfReservations[i], {
        success: function() {},
        error: function(nr, msg) {
          util.log('ERROR: '+nr+': '+msg);
        }
      });
    }    
  });  
}

app.get('/reset', function(req, res) {  
  initDb();
  res.send('Database was filled with initial values.');
});
app.get('/query/restaurantInfo', function(req, res) {  
  res.send(restaurantInfo);
});
app.get('/query/range', function(req, res) {
  genericServer.db.getAllModels('reservation', {
    success: function(allReservations) {
      // TODO: use sql select
      var startDate = util.readDate(req.query.start);
      var endDate = util.readDate(req.query.end);
      util.log('Returning reservations between '+ startDate + ' and ' + endDate);
      var reservationsInRange = _.filter(allReservations, function(reservation) { 
        var date = util.readDate(reservation.date);
        return date >= startDate && date <= endDate;
      });
      
      //util.log(reservationsInRange);
      res.send( reservationsInRange );},
      error: function(nr, msg) {
        util.log('ERROR: '+nr+': '+msg);
      }
  });

});

function testSql() {
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'noneshallpass'
  });

  connection.connect();
  connection.query('USE Hello');
  
  // NOTE: use connection.escape for user-provided data to prevent SQL injection attacks, or use '?' (does it automatically)
  // connection.query('SELECT * FROM users WHERE id = ?', [userId], function(err, results) {
  var queryStr = 'SELECT * FROM rel WHERE Identifier=3';
  connection.query(queryStr, function(err, rows, fields) {
    if (err) throw err;
    util.log('SQL output for '+queryStr+' ('+rows.length+' lines)');
    for (var i=0; i<rows.length; i++)
      util.log(rows[i]);
  });
  connection.end();
}

var server = genericServer.createServer(app);

var io = socketIO.listen(server, { log: false });

genericServer.db.onChange(function(){
  util.log('Push refresh event');
  io.sockets.emit('refresh', null);
});

genericServer.listen( server ); // when using socket.io, server listen does not block
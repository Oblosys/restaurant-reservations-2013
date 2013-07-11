/**
 * Web server for reservations app
 */


var restaurantInfo = { maxNrOfPeople: 12 };

var _ =             require('underscore')
  , Backbone =      require('backbone')
  , mysql =         require('mysql')
  , util =          require('./shared/util.js')
  , genericServer = require('./genericServer.js')
  , app;

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
  var today = new Date();
  var templatess = _.flatten(util.replicate(n,someReservations), true); // array of arrays (lists of reservations per day)
  var reservations = [];
  var id = 0;
  for (var i=0; i<templatess.length; i++) {
    for (var j=0; j<templatess[i].length; j++) {
      var reservation = _.clone(templatess[i][j]);
      reservation.id='reservation-'+id++;
      reservation.date=util.showDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()+i));
      reservations.push(reservation);
    }
  }
  return reservations;
}

function initDb() {
  util.log('initDb');
  // todo: clear db
  var lotOfReservations = makeLotOfReservations(20);

  for (var i=0; i<lotOfReservations.length; i++) {
    genericServer.createModelSql('reservation', lotOfReservations[i]);
  }
}

app.get('/reset', function(req, res) {  
  initDb();
  res.send('Database was reset with initial values.');
});
app.get('/query/restaurantInfo', function(req, res) {  
  res.send(restaurantInfo);
});
app.get('/query/range', function(req, res) {
  var allReservations = genericServer.root.reservation.models;

  //console.log(JSON.stringify(genericServer.root));
  var startDate = util.readDate(req.query.start);
  var endDate = util.readDate(req.query.end);
  console.log('Returning reservations between '+ startDate + ' and ' + endDate);
  
  res.send(_.filter(allReservations, function(reservation) { 
    var date = util.readDate(reservation.date);
    return date >= startDate && date <= endDate;
  }));
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

genericServer.createServer(app);

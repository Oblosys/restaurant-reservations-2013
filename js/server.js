/**
 * Web server for reservations app
 */

var _ = require('underscore')
  , Backbone = require('backbone')
  , genericServer = require('./genericServer.js')
  , app;

function readDate(dateStr) {
  var parts = dateStr.split('-');
  if (parts.length == 3)
    return new Date(parts[2], parts[1]-1, parts[0]);
  else
    throw 'Exception: Incorrect date: "'+dateStr+'"';
}
//console.log(readDate('4-6-2013'));
app = genericServer();

// cannot set properties directly (so genericServer.root = .. fails)
genericServer.root.reservation =
 { idCounter: 10
 , models: [ {id:'reservation-1', name:'Martijn', date:'4-6-2013', nrOfPeople: 3}
           , {id:'reservation-2', name:'Henk', date:'4-6-2013', nrOfPeople: 2}
           , {id:'reservation-3', name:'Carel', date:'5-6-2013', nrOfPeople: 2}
           , {id:'reservation-4', name:'Anna', date:'6-6-2013', nrOfPeople: 3}
           , {id:'reservation-5', name:'Pino', date:'7-6-2013', nrOfPeople: 8}
           ]
 };

var allReservations = genericServer.root.reservation.models;

app.get('/query/range', function(req, res) {
  //console.log(JSON.stringify(genericServer.root));
  var startDate = readDate(req.query.start);
  var endDate = readDate(req.query.end);
  console.log('Returning reservations between '+ startDate + ' and ' + endDate);
  
  res.send(_.filter(allReservations, function(reservation) { 
    var date = readDate(reservation.date);
    return date >= startDate && date <= endDate;
  }));
});


genericServer.createServer(app);

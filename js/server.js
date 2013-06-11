/**
 * Web server for reservations app
 */

var _ = require('underscore')
  , Backbone = require('backbone')
  , util = require('./client/util.js')
  , genericServer = require('./genericServer.js')
  , app;

console.log(util.readDate('4-6-2013'));
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
  var startDate = util.readDate(req.query.start);
  var endDate = util.readDate(req.query.end);
  console.log('Returning reservations between '+ startDate + ' and ' + endDate);
  
  res.send(_.filter(allReservations, function(reservation) { 
    var date = util.readDate(reservation.date);
    return date >= startDate && date <= endDate;
  }));
});


genericServer.createServer(app);

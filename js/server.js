/**
 * Web server for reservations app
 */
// TODO: inline todos
// TODO: editable reservations: 
//         offer to cancel on unintended navigation?
//         check if reservation is dirty before offering save
//         date change (might be trickier)
// TODO: check IE and iOS and windows, etc.
// TODO: make some log functions for collections and models
// TODO: maybe cache viewed months?
// TODO: check http://ozkatz.github.io/avoiding-common-backbonejs-pitfalls.html
// LATER: check if update on reservation is handled correctly in reservation and in calendar (not a normal scenario yet)


var restaurantInfo = { maxNrOfPeople: 12 };

var _ = require('underscore')
  , Backbone = require('backbone')
  , util = require('./shared/util.js')
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

var lotOfReservations = makeLotOfReservations(20);

// cannot set properties directly (so genericServer.root = .. fails)
genericServer.root.reservation =
 { idCounter: lotOfReservations.length
 , models: lotOfReservations
/*  idCounter: lotOfReservations.length
 , models: [ {id:'reservation-1', name:'Martijn', date:'4-6-2013', nrOfPeople: 3}
           , {id:'reservation-2', name:'Henk', date:'4-6-2013', nrOfPeople: 2}
           , {id:'reservation-3', name:'Carel', date:'5-6-2013', nrOfPeople: 2}
           , {id:'reservation-4', name:'Anna', date:'6-6-2013', nrOfPeople: 3}
           , {id:'reservation-5', name:'Pino', date:'7-6-2013', nrOfPeople: 8}
           ] */
 };

var allReservations = genericServer.root.reservation.models;

app.get('/query/restaurantInfo', function(req, res) {  
  res.send(restaurantInfo);
});
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

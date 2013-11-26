console.log('executing reservations.js');
$(document).ready(function(){
  initialize2();
});

var Reservation = Backbone.Model.extend({
  defaults: {
    date: '1-1-2000',
    name: 'name',
    nrOfPeople: 2
  },
  urlRoot: '/model/reservation'
});

var Day = Backbone.Model.extend({
  defaults: {
    za: 'bla',
    name: 'name'
//    reservation1 : new Reservation({name: 'Pino'}), 
//    reservation2 : new Reservation({name: 'Tommie'}), 
  },
  urlRoot: '/model/day'
});

var Reservations = Backbone.Collection.extend({
  model: Reservation,
  url: '/model/reservations'
});

var day = new Day({name: 'Monday', reservations: new Reservations()});
console.log('day is');

var SomeReservations = Backbone.Model.extend({
  url: '/model/somereservations'
});


//todo: use window.reservations?
var reservations = new Reservations();
//reservations.set('reservations', new Reservations);

var reservation, reservation2;

function initialize1() {
  day.get('reservations').on("add", refreshReservations);
  day.get('reservations').on("remove", refreshReservations);
/*
  var action = reservations.fetch({
    success: function() {
      console.log('reservations: ');
      console.log(reservations.toJSON());
      //refreshReservations();
     },
    error: function() {alert('err');}
  });
*/
  reservation = new Reservation({ name:"Pino1"});
  reservation2 = new Reservation({ name:"Pino2"});
  saveAll([reservation, reservation2, day]);
  console.log('after save');
  //reservation.save({success: function(){reservation2.save();}});
//reservation2.save();
  //reservation2.save();

  day.set('reservation1', reservation);
  day.set('reservation2', reservation2);
  //reservations.reservations.remove(reservation);
  //day.save();
  registerEditor(reservation, 'date', $('#field1X'));
  registerEditor(reservation, 'name', $('#field1Y'));
  registerEditor(reservation, 'nrOfPeople', $('#field1Z'));
  registerEditor(reservation, 'date', $('#field2X'));
  registerEditor(reservation, 'name', $('#field2Y'));
  registerEditor(reservation, 'nrOfPeople', $('#field2Z'));
  
//  console.log('data.get '+reservation.get('x'));
}

function initialize2() {
  var m = new Day();
  m.on('change:za', function() {util.log('change:za');});
  m.on('change', function() {util.log('change');});
  m.set('za','zazaza');
  util.log('za: '+m.get('za'));
}

function saveCont(o,c) {
  o.save({ success: c() });
}

function saveAll(models) {
   if (models.length == 0)
     return;
   else {
     var model = models.shift();
     console.log('Saving '+model.get('name')+ ' '+models.length);
     model.save({},{success: function() {saveAll(models);} });
   } 
}

function refreshReservations() {
  console.log('refreshReservations()');
  $('#reservationList').empty();
  $('#reservationList').append( JSON.stringify(reservation.toJSON()) + '<br/>');
  $('#reservationList').append( JSON.stringify(reservation2.toJSON()) + '<br/>');
  $('#reservationList').append( JSON.stringify(day.toJSON()) + '<br/>');
/*
  $('#reservationList').append( '<table>' );
  day.get('reservations').each(function(res) {
    console.log('ja');
    $('#reservationList').append( '<tr><td>' + res.get('date') + '</td><td>' + res.get('name') + '</td><td>' + res.get('nrOfPeople') + '</td><td>' + res.get('id') + '</td></tr>');
  });
  $('#reservationList').append( '</table>' );
  */
}


function saveButton() {
//  console.log(reservations.toJSON());
  reservations.save();
}

function testButton() {
  console.log('Test button pressed');
  //reservations.create({ name:"Pino"});
  reservation.set('name','Tommie');
  //day.save();
  day.destroy();

  //reservations.add(reservation);
 }

function refreshButton() {
  //console.log(reservations.toJSON());
  refreshReservations();
  console.log(day.get('name'));
}





//observing / editing values

function registerEditor(model, prop, elt) {
  var $elt = $(elt);
  $elt.change( function () { model.set(prop,$elt.val()); } );
  initObserver(model,prop,$elt);
}

function initObserver(model, prop, elt) {
  elt.val(model.get(prop));
  model.on("change:"+prop,changeHandler,elt);
}

function changeHandler(model,newVal) {
  this.val(newVal);
//  console.log(model.get('x'));
}


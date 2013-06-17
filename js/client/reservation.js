/* global util:false */


console.log('executing reservation.js');
$(document).ready(function(){
  initialize();
});

var Reservation = Backbone.Model.extend({
  defaults: {
    date: '1-1-2000',
    name: 'name',
    nrOfPeople: 2
  },
  urlRoot: '/model/reservation'
});

var Reservations = Backbone.Collection.extend({
  model: Reservation,
  url: '/query/range?start=17-6-2013&end=17-6-2013'
});
var reservationsToday;

var newReservation;

function initialize() {
  console.log('initializing');
  newReservation = new Reservation();
  $('.NrOfPeopleButtons input').each(function(i) {
    $(this).click(function() {
        newReservation.set('nrOfPeople', i);
    });
  });
  
  var today = new Date();
  var dayLabels = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
  var dateLabels = ['Today ('+util.showDate(today)+')','Tomorrow'];
  var weekDay = today.getDay(); // 0 is Sunday
  for (var d=0; d<6; d++)
    dateLabels.push(dayLabels[(d+weekDay+2)%7]);
  $('.LargeDayButtons input,.SmallDayButtons input').each(function(i) {
    var buttonDate = new Date(today);
    buttonDate.setDate( today.getDate() + i );
    $(this).attr('value', dateLabels[i]);
    $(this).click(function() {
      newReservation.set('date', util.showDate(buttonDate));
    });
  });
  
  var timeLabels = [];
  for (var hr=18; hr<25; hr++) {
    timeLabels.push(hr+':00');
    timeLabels.push(hr+':30');
  }
  $('.TimeButtons input').each(function(i) {
    $(this).attr('value', timeLabels[i]);
    $(this).click(function() {
      newReservation.set('time', timeLabels[i]);
    });
  });
}

function log() {
  $('#log').empty();
  $('#log').append( JSON.stringify(newReservation) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  log();
}

function testButton2() {
  console.log('Test button 2 pressed, create');
}
function testButton3() {
  console.log('Test button 3 pressed, remove');
}
function testButton4() {
  console.log('Test button 4 pressed');
}
function refreshButton() {
  console.log('Refresh button pressed');
  viewedMonth.fetch();
  logViewedMonth();
}

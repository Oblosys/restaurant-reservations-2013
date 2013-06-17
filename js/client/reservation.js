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

function initialize() {
  console.log('initializing');
}

function log() {
  $('#log').empty();
  $('#log').append( 'logging' +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  log();
  //console.log(JSON.stringify(viewedMonth));
}

function testButton2() {
  console.log('Test button 2 pressed, create');
  viewedMonth.create({name:'Ieniemienie', date: '1-6-2013', nrOfPeople: 2});
}
function testButton3() {
  console.log('Test button 3 pressed, remove');
  viewedMonth.remove(viewedMonth.findWhere({name: 'Ieniemienie'}));
  
//  console.log(JSON.stringify(viewedMonth));
}
function testButton4() {
  console.log('Test button 4 pressed');
//  console.log(JSON.stringify(viewedMonth));
}
function refreshButton() {
  console.log('Refresh button pressed');
  viewedMonth.fetch();
  logViewedMonth();
}

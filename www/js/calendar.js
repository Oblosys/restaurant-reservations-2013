console.log('executing calendar.js');
$(document).ready(function(){
  initialize();
});

var Reservation = Backbone.Model.extend({
  defaults: {
    date: '1-1-2000',
    name: 'name'
  },
  urlRoot: '/model/reservation'
});

var Reservations = Backbone.Collection.extend({
  model: Reservation,
  url: '/query/range?start=1-6-2013&end=30-6-2013'
});
var viewedMonth;

var Selection = Backbone.Model.extend({});
var selection = new Selection;

selection.on('change:day', function(model, newDay) {
  //console.log('day: '+$(selection.previous('day')).attr('id')+'~>'+$(newDay).attr('id'));
  $(selection.previous('day')).removeAttr('selected'); // $() takes care of any undefineds
  $(newDay).attr('selected','selected');
});
selection.on('change:hour', function(model, newHour) {
  console.log('hour: '+$(selection.previous('hour')).attr('id')+'~>'+$(newHour).attr('id'));
  $(selection.previous('hour')).removeAttr('selected'); // $() takes care of any undefineds
  $(newHour).attr('selected','selected');
});

function initialize() {
  $('#calendar .week .day').each(function(i) {
    $(this).attr('id','day-'+i);
    $(this).html('<div class="dayContent">'+i+'</div>');
    $(this).click( function() { selection.set('day', this);} );
  });
  $('.hourHeader .hour').each(function(i) {
    $(this).attr('id','hour-'+i);
    $(this).click( function() { selection.set('hour', this);} );
  });
  

  viewedMonth = new Reservations;
  viewedMonth.on("add", function(mdl,cln,opts) {console.log('Reservation added '+mdl.get('name')); logViewedMonth();});
  viewedMonth.on("remove", function() {console.log('Reservation added'); logViewedMonth();});
  viewedMonth.fetch();
}

function clickDay(day) {
  selection.set('day', day);
}
function logViewedMonth() {
  $('#log').empty();
  $('#log').append( JSON.stringify(viewedMonth) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  console.log(JSON.stringify(viewedMonth));
}
function testButton2() {
  console.log('Test button 2 pressed, create');
  viewedMonth.create({name:'Ieniemienie', date: '10-6-2013'});
}
function testButton3() {
  console.log('Test button 3 pressed, fetch');
  viewedMonth.fetch();
//  console.log(JSON.stringify(viewedMonth));
}
function testButton4() {
  console.log('Test button 4 pressed');
//  console.log(JSON.stringify(viewedMonth));
}
function refreshButton() {
  console.log('Refresh button pressed');
  logViewedMonth();
}

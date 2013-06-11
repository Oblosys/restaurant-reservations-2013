console.log('executing calendar.js');
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
  url: '/query/range?start=1-6-2013&end=30-6-2013'
});
var viewedMonth;
var currentMonth; 
  
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


function dayCellRefresh(dayCell) {
  var cellDate = $(dayCell).attr('date');
  var reservationsForCell = viewedMonth.where({date: cellDate});
  console.log(reservationsForCell);
  var nrOfPeople = _.reduce(reservationsForCell, function(nr,res) {return nr+res.get('nrOfPeople')}, 0);
  //console.log(reservationsForDay);
  $(dayCell).find('.dayContent').html(reservationsForCell.length + ' ('+nrOfPeople+')');
}

// TODO: don't use .day for header, and then update all selectors (remove .week)
// TODO: fix width of colums (is proportional to day names)
// TODO: rename viewedMonth to something with 'reservations'

function handleReservationAdded(res,coll,opts) {
  console.log('Reservation added '+res.get('name'));
  logViewedMonth();
  console.log('#calendar .week .day[date="'+res.get('date')+'"]');
  var dayCell = $('#calendar .week .day[date="'+res.get('date')+'"]');
  dayCellRefresh(dayCell);
}
// TODO: need full views here? Maybe not
// TODO: handle removal

function handleReservationRemoved(res,coll,opts) {
  console.log('Reservation removed '+res.get('name'));
  logViewedMonth();
}

function showDate(date) {
  return date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
}
function getNumberOfDaysInMonth(year,month) {
  return (new Date(year,month + 1,0)).getDate(); 
  // day is 0-based, so day 0 of next month is last day of this month (also works correctly for December.)
}

function initialize() {
  var today = new Date();
  var currentMonth = today.getMonth();
  var currentYear = today.getFullYear();
  var nrOfDaysInPreviousMonth = getNumberOfDaysInMonth(currentYear, currentMonth-1);
  var nrOfDaysInCurrentMonth = getNumberOfDaysInMonth(currentYear, currentMonth);
  var firstDayOfMonth = ((new Date(currentYear,currentMonth,1)).getDay()+6)%7; //getDay has Sun=0 instead of Mon
  
  var previousMonthDates =_.range(nrOfDaysInPreviousMonth-firstDayOfMonth,nrOfDaysInPreviousMonth).map(function(day){
    return new Date(currentYear,currentMonth-1,day);
  });
  var currentMonthDates = _.range(1,nrOfDaysInCurrentMonth).map(function(day){
    return new Date(currentYear,currentMonth,day);
  });
  var nextMonthDates = _.range(1,14).map(function(day){ // will never be more than 14
    return new Date(currentYear,currentMonth+1,day);
  });
  var dates = previousMonthDates.concat(currentMonthDates).concat(nextMonthDates);
  //console.log(''+nrOfDaysInPreviousMonth+' '+nrOfDaysInCurrentMonth+firstDayOfMonth);
  //console.log(previousMonthDates);
  //console.log(currentMonthDates);
  $('#calendar .week .day').each(function(i) {
    $(this).attr('id','day-'+i);
    $(this).attr('date', showDate(dates[i]));
    if (dates[i].getMonth() == currentMonth) 
      $(this).attr('isCurrentMonth', 'isCurrentMonth');
    else
      $(this).removeAttr('isCurrentMonth');
    $(this).html('<div class="dayNr">'+dates[i].getDate()+'</div><div class="dayContent"></div>');
    $(this).click( function() { selection.set('day', this);} );
  });
  $('.hourHeader .hour').each(function(i) {
    $(this).attr('id','hour-'+i);
    $(this).click( function() { selection.set('hour', this);} );
  });
  
  
  $('#calendar .week .day').each(function(i) {
    
    //console.log($(this).attr('id') +' x'+i +'x  '+(i<dates.length ? showDate(dates[i]) : ''));
    
  });
  
  viewedMonth = new Reservations;
  viewedMonth.on("add", handleReservationAdded);
  viewedMonth.on("remove", handleReservationRemoved);
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
  viewedMonth.create({name:'Ieniemienie', date: '10-6-2013', nrOfPeople: 2});
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

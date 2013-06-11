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

var Day = Backbone.Model.extend({
  defaults: {
    date: new Date(1000,1,1) // valid but unused date
  },
  initialize: function() {
    var reservations = new Reservations()
    this.set('reservations', reservations); // not in defaults, because then all days will share reservations
   
    // need to redirect all change events from reservation collection 
    var day = this;
    reservations.on('change', function() {console.log('change'); day.trigger('change');}); // child reservation change, propagated to collection  
    reservations.on('add',    function() {console.log('add');    day.trigger('change');});  
    reservations.on('remove', function() {console.log('remove'); day.trigger('change');});
    reservations.on('reset',  function() {console.log('reset');  day.trigger('change');});    
  }// not synced, so no url
});

var DayCellView = Backbone.View.extend({
  tagName: "div",
  className: "day",
  events: {
//     "click .icon":          "open",
//     "click .button.edit":   "openEditDialog",
//     "click .button.delete": "destroy"
  },

  initialize: function() {
    //sconsole.log('init view');
    this.listenTo(this.model, "change", this.render);
  },

  render: function() {
    //console.log('rendering');
    var cellDate = this.model.get('date');
    var reservationsForCell = this.model.get('reservations');
    var nrOfPeople = reservationsForCell.reduce(function(nr,res) {return nr+res.get('nrOfPeople')}, 0);
    
    this.$el.html('<div class="dayNr">'+cellDate.getDate()+'</div>'+
                 '<div class="dayContent">'+(reservationsForCell.length==0 ? '' : reservationsForCell.length + ' ('+nrOfPeople+')')+
                 '</div>');
    return this;
  }
});

var days;
var dayViews;

var Selection = Backbone.Model.extend({});
var selection = new Selection();

selection.on('change:day', function(model, newDay) {
  //console.log('day: '+$(selection.previous('day')).attr('id')+'~>'+$(newDay).attr('id'));
  $(selection.previous('day')).removeAttr('selected'); // $() takes care of any undefineds
  $(newDay).attr('selected','selected');
});
selection.on('change:hour', function(model, newHour) {
  //console.log('hour: '+$(selection.previous('hour')).attr('id')+'~>'+$(newHour).attr('id'));
  $(selection.previous('hour')).removeAttr('selected'); // $() takes care of any undefineds
  $(newHour).attr('selected','selected');
});


// TODO: don't use .day for header, and then update all selectors (remove .week)
// TODO: fix width of colums (is proportional to day names)
// TODO: rename viewedMonth to something with 'reservations'

function handleReservationAdded(res,coll,opts) {
  console.log('Reservation added '+res.get('name'));
  //console.log('#calendar .week .day[date="'+res.get('date')+'"]');
  //var dayCell = $('#calendar .week .day[date="'+res.get('date')+'"]');
  
  var correspondingDay = _.find(days, function(day){return util.showDate(day.get('date'))==res.get('date');});
  console.log('correspondingDay = '+correspondingDay.get('date'));
  correspondingDay.get('reservations').add(res);
  //if(res.get('date')==day.get('date')) {
  //  day.get('reservations').add(res);
  //}
  logViewedMonth();
  
}
// TODO: need full views here? Maybe not

function handleReservationRemoved(res,coll,opts) {
  console.log('Reservation removed '+res.get('name'));
  var correspondingDay = _.find(days, function(day){return util.showDate(day.get('date'))==res.get('date');});
  correspondingDay.get('reservations').remove(res);
  logViewedMonth();
}

function getNumberOfDaysInMonth(year,month) {
  return (new Date(year,month + 1,0)).getDate(); 
  // day is 0-based, so day 0 of next month is last day of this month (also works correctly for December.)
}

function setCurrentYearMonth(currentYear,currentMonth) {
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
    $(this).attr('date', util.showDate(dates[i]));
    if (dates[i].getMonth() == currentMonth) 
      $(this).attr('isCurrentMonth', 'isCurrentMonth');
    else
      $(this).removeAttr('isCurrentMonth');
    //$(this).html('<div class="dayNr">'+dates[i].getDate()+'</div><div class="dayContent"></div>');
    $(this).click( function() { selection.set('day', this);} );
  });
  
  for (var i=0; i<days.length; i++) {
    days[i].set('date', dates[i]);
  };

}
function initialize() {
  // create dayViews
  var dayElts = $('#calendar .week .day').toArray();

  days = $('#calendar .week .day').map(function(ix) {
    var day = new Day({date: new Date()});
    var dayView = new DayCellView({model: day, el: dayElts[ix]});
    return day;
  });
  
  
  //console.log(days[5].get('date'));
  //console.log(dayElts[5]);
  //dayCellView = new DayCellView({model: days[5], el: dayElts[5]});
  //days[5].trigger('change');
  $('.hourHeader .hour').each(function(i) {
    $(this).attr('id','hour-'+i);
    $(this).click( function() { selection.set('hour', this);} );
  });

  var today = new Date();
  setCurrentYearMonth(today.getFullYear(), today.getMonth());
  
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
  $('#log').append( JSON.stringify(viewedMonth.models) +'<br/>');
  //$('#log').append( JSON.stringify(day) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  var martijnRes = viewedMonth.findWhere({name: 'Martijn'});
  //var newRes = new Reservation({name: 'a Name'});
  //day.get('reservations').add(newRes);
  martijnRes.set('nrOfPeople',10);
  //day.get('reservations').remove(martijnRes);
  //day.get('reservations').reset(newRes);
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

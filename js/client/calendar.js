/* global util:false */

// TODO: check events in views and remove commented code afterwards (e.g. "click .button.edit" etc.)

console.log('executing calendar.js');
$(document).ready(function(){
  v = new example_view({el:$("#example")});
  initialize();
});


var example_view = Backbone.View.extend({
  events: {
    'click div' : 'alertdd'
  },
  example_event : function(event) {
    alert('ja');
    //need to get the data-name here
  } 
});

/***** Globals *****/

var viewedReservations;

var selection;
var dayView;
var reservationView;
var days;

var monthNames = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];


/***** Backbone models *****/

var Selection = Backbone.Model.extend({
  // attributes: yearMonth :: {year :: Int, month :: Int}
  //             day :: Day
  //             reservation :: Reservation
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
  comparator: 'time',
  url: ''
});

var Day = Backbone.Model.extend({
  defaults: {},
  initialize: function() {
    var reservations = new Reservations();
    this.set('reservations', reservations); // not in defaults, because then all days will share reservations
   
    // need to propagate all change events from reservation collection 
    var day = this;
    reservations.on('change', function() {/*console.log('change');*/ day.trigger('change');}); // child reservation change, propagated to collection  
    reservations.on('add',    function() {/*console.log('add');*/    day.trigger('change');});  
    reservations.on('remove', function() {/*console.log('remove');*/ day.trigger('change');});
    reservations.on('reset',  function() {/*console.log('reset');*/  day.trigger('change');});    
  }// not synced, so no url
});


/***** Backbone views *****/

// Calendar cells
var DayCellView = Backbone.View.extend({
  tagName: "div",
  className: "dayCell",

  // Alternative way to bind click event. Harder to debug, since typos in handler do not cause errors.
  // Use only when many events are bound to different children of the view. 
  //events: {
  //   "click":         "selectDay"
  //},
  //selectDay: function() {selectDay(this.model);},
  
  initialize: function() {
    console.log('init view ');
    var dayModel = this.model;
    $(this.el).click( function() { selectDay(dayModel); } );

    this.listenTo(this.model, "change", this.render);
    this.listenTo(selection, "change:day", this.renderSelection);
    // causes lot of events on selection (one to each cell), but is elegant. TODO: optimize single event? 
  },
  test: function() {
    alert('test');
  },

  renderSelection: function(selectionModel, newDay) {
    //console.log('selection changed '+this.model.get('date')+' ',selectionModel,' '+newDay.get('date')+' '+$(selection.previous('day')).attr('date'));
    setAttr(this.$el, 'selected', this.model.get('date') == newDay.get('date'));
  },
  render: function() {
    //console.log('rendering');
    var cellDate = this.model.get('date');
    var reservationsForCell = this.model.get('reservations');
    var nrOfPeople = reservationsForCell.reduce(function(nr,res) {return nr+res.get('nrOfPeople');}, 0);
    
    this.$el.html('<div class="dayNr">'+cellDate.getDate()+'</div>'+
                 '<div class="dayCellContent">'+(reservationsForCell.length==0 ? '' : reservationsForCell.length + ' ('+nrOfPeople+')')+
                 '</div>');
    return this;
  }
});

//List of reservations for the selected day
var DayView = Backbone.View.extend({  
  tagName: "div",
  className: "dayView",

  initialize: function() {
    this.listenTo(selection, "change:day", function(selectionModel, newSelection){ this.setModel(newSelection);});
    this.listenTo(selection, "change:reservation", this.renderSelection);
  },
  setModel: function(model) {
    this.stopListening(this.model, "change");
    this.model = model;
    this.listenTo(this.model, "change", this.render);
    this.render();
  },
  // Rather than having a subview for each reservation line, we render their selection here. 
  // This is slightly less elegant, but saves the complication of having another view.
  renderSelection: function(selectionModel, newReservation) {
    //console.log('selected reservation changed '+newReservation.get("time")+':'+newReservation.get('name')+' prev:'+previousRes.attr('time')+':'+previousRes.attr('name'));
    var $reservationLines = this.$('.reservationLine');
    var viewedDayReservations = this.model.get('reservations');
    for (var i=0; i<$reservationLines.length; i++) 
      setAttr($($reservationLines[i]), 'selected', viewedDayReservations.at(i) === newReservation );
  },
  render: function() {
    console.log('rendering dayView');
    var date = this.model.get('date');
    var reservationsForDay = this.model.get('reservations'); // is a Day
    var html = '<div id="selectedDayLabel">Reserveringen voor '+date.getDate()+' '+monthNames[date.getMonth()]+'</div>'+
               '<div id="reservationsPerDay">';
    reservationsForDay.each(function(res){html += '<div class="reservationLine">'+res.get("time")+' : '+res.get('name')+' ('+res.get('nrOfPeople')+')</div>';});
    html += '</div>';
    this.$el.html(html);
    this.$el.find('.reservationLine').each(function(ix) {
      $(this).click( function() {
        selectReservation(reservationsForDay.models[ix]);
      });
    });
    return this;
  }
});

// Selected reservation
var ReservationView = Backbone.View.extend({
  tagName: "div",
  className: "reservationView",

  initialize: function() { //
    this.listenTo(selection, "change:reservation", this.render);
  },
  render: function() {
    console.log('rendering reservationView');
    var reservation = selection.get('reservation'); // doesn't have its own model
    var html = '';
    var time = '';
    var name = '';
    var nrOfPeople = '';
    var comment = ''; 
    
    if (reservation) { 
      time = reservation.get('time');
      name = reservation.get('name');
      nrOfPeople = reservation.get('nrOfPeople');
      comment = reservation.get('comment');
    }  
    html += 'Time: <span class="info">'+time+'</span><br/>';
    html += 'Name: <span class="info">'+name+'</span><br/>';
    html += 'Nr. of people: <span class="info">'+nrOfPeople+'</span><br/>';
    html += 'Comment:<br/><div class="commentView info">';
    html += comment;
    html += '</div>';
    
    this.$el.html(html);
    return this;
  }
});


/***** Init ****/

function initialize() {
  selection = new Selection();
  
  // create dayCellViews
  var dayElts = $('.dayCell').toArray();

  days = $('.dayCell').map(function(ix) {
    $(this).attr('id','dayCell-'+ix);
    var day = new Day({date: new Date()});
    new DayCellView({model: day, el: dayElts[ix]}); // DayCellViews are not stored in a var, has not been necessary yet.
    return day;
  });
  
  dayView = new DayView({el: document.getElementById('dayView')});
  
  reservationView = new ReservationView({el: document.getElementById('reservationView')});
  
  var today = new Date();
  
  viewedReservations = new Reservations();
  viewedReservations.on("add", handleReservationAdded);
  viewedReservations.on("remove", handleReservationRemoved);

  selection.on('change:yearMonth', setYearMonth);
  selection.set('yearMonth', {year: today.getFullYear(), month: today.getMonth()});
  selection.set('day', _.find(days, function(day) {return util.showDate(day.get('date'))==util.showDate(today);}));
}


/***** Event handlers *****/

function selectDay(selectedDay) {
  selection.set('day', selectedDay);
  selectReservation(selectedDay.get('reservations').at(0));
}

function selectReservation(selectedReservation) {
  selection.set('reservation',selectedReservation);
}

function setYearMonth() {
  var yearMonth = selection.get('yearMonth');
  $('#monthLabel').text(monthNames[yearMonth.month]+' '+yearMonth.year);
  setCurrentYearMonth(yearMonth.year, yearMonth.month);
  // TODO: handle reservations + handlers
}

//TODO: need full views here? Maybe not
function handleReservationAdded(res,coll,opts) {
  //console.log('Reservation added '+res.get('name')+' date:'+res.get('date'));
  //for (var i=0;i<days.length; i++) console.log(days[i].get('date'));
  // need find instead of findWhere, since the date needs to be converted
  var correspondingDay = _.find(days, function(day){return util.showDate(day.get('date'))==res.get('date');});
  //console.log('correspondingDay = '+correspondingDay.get('date'));
  correspondingDay.get('reservations').add(res);
}

function handleReservationRemoved(res,coll,opts) {
  //console.log('Reservation removed '+res.get('name')+' date:'+res.get('date'));
  var correspondingDay = _.find(days, function(day){return util.showDate(day.get('date'))==res.get('date');});
  correspondingDay.get('reservations').remove(res);
}

function setCurrentYearMonth(currentYear,currentMonth) {
  while (viewedReservations.length) // remove all viewed reservations
    viewedReservations.pop();

  var nrOfDaysInPreviousMonth = getNumberOfDaysInMonth(currentYear, currentMonth-1);
  var nrOfDaysInCurrentMonth = getNumberOfDaysInMonth(currentYear, currentMonth);
  var firstDayOfMonth = ((new Date(currentYear,currentMonth,1)).getDay()+6)%7; //getDay has Sun=0 instead of Mon
  
  // note: _.range(x,y) == [x..y-1] 
  var previousMonthDates =_.range(nrOfDaysInPreviousMonth+1-firstDayOfMonth,nrOfDaysInPreviousMonth+1).map(function(day){
    return new Date(currentYear,currentMonth-1,day);
  });
  var currentMonthDates = _.range(1,nrOfDaysInCurrentMonth+1).map(function(day){
    return new Date(currentYear,currentMonth,day);
  });
  var nextMonthDates = _.range(1,14).map(function(day){ // will never be more than 14
    return new Date(currentYear,currentMonth+1,day);
  });
  
  // dates contains all dates that are visible in the calendar page for (currentMonth,currentYear)
  var dates = previousMonthDates.concat(currentMonthDates).concat(nextMonthDates);

  $('.dayCell').each(function(ix) {
    $(this).attr('date', util.showDate(dates[ix]));
    setAttr( $(this), 'isCurrentMonth', dates[ix].getMonth() == currentMonth);
  });
  
  for (var i=0; i<days.length; i++) {
    days[i].set('date', dates[i]);
  }
  
  viewedReservations.url = '/query/range?start='+util.showDate(dates[0])+'&end='+util.showDate(dates[6*7-1]);
  //console.log('url:'+'/query/range?start='+util.showDate(dates[0])+'&end='+util.showDate(dates[6*7-1]));
  viewedReservations.fetch({success: function() {selectDay(selection.get('day'));}});
  // after all reservations have been fetched, we select the day again to select the first reservation of the day.
}


/***** Button handlers *****/

function prevMonthButton() {
  console.log('Prev month button pressed');
  var yearMonth = selection.get('yearMonth');
  var currentYearMonth = new Date(yearMonth.year, yearMonth.month-1,1);
  selection.set('yearMonth', {year: currentYearMonth.getFullYear(), month: currentYearMonth.getMonth()});
}

function nextMonthButton() {
  console.log('Next month button pressed');
  var yearMonth = selection.get('yearMonth');
  var currentYearMonth = new Date(yearMonth.year, yearMonth.month+1,1);
  selection.set('yearMonth', {year: currentYearMonth.getFullYear(), month: currentYearMonth.getMonth()});
}


/***** Utils *****/

/* Set boolean DOM attribute for jQuery object $elt according to HTML standard.
 * (absence denotes false, attrName=AttrName denotes true) */
function setAttr($elt, attrName, isSet) {
  if (isSet) 
    $elt.attr(attrName, attrName);
  else
    $elt.removeAttr(attrName);  
}

function getNumberOfDaysInMonth(year,month) {
  return (new Date(year,month + 1,0)).getDate(); 
  // day is 0-based, so day 0 of next month is last day of this month (also works correctly for December.)
}


/***** Debug *****/

function logViewedReservations() {
  $('#log').empty();
  $('#log').append( JSON.stringify(viewedReservations.models) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  var martijnRes = viewedReservations.findWhere({name: 'Martijn'});
  //var newRes = new Reservation({name: 'a Name'});
  martijnRes.set('nrOfPeople',10);
  //console.log(JSON.stringify(viewedReservations));
}

function testButton2() {
  console.log('Test button 2 pressed, create');
//  viewedReservations.create({name:'Ieniemienie', date: '1-6-2013', nrOfPeople: 2});
  while (viewedReservations.length)
    viewedReservations.pop();
  viewedReservations.url = '/query/range?start=1-7-2013&end=11-8-2013';
}
function testButton3() {
  console.log('Test button 3 pressed, remove');
  //viewedReservations.remove(viewedReservations.findWhere({name: 'Ieniemienie'}));
  //console.log('url:'+'/query/range?start='+util.showDate(dates[0])+'&end='+util.showDate(dates[6*7-1]));
  viewedReservations.fetch();
  console.log( 'viewedReservations.length '+viewedReservations.length );
//  console.log(JSON.stringify(viewedReservations));
}
function testButton4() {
  console.log('Test button 4 pressed');
  viewedReservations.fetch();
//  console.log(JSON.stringify(viewedReservations));
}
function refreshButton() {
  console.log('Refresh button pressed');
  viewedReservations.fetch();
  logViewedReservations();
}

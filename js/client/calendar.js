/* global util:false */

/* 
 * TODO:
 * handle multiple months
 * show reservations for partial previous and next months */
// TODO: do id and handler setting for cells in init rather than in setCurrentYearMonth
// TODO: selection change doesn't have the correct day
         // figure out whether to record selection as Day instead of div elt, or look it up

// TODO: don't use .dayCell for header, and then update all selectors (remove .week)
// TODO: rename viewedMonth to something with 'reservations'
// TODO: are selections okay like this, without a model of their own?



console.log('executing calendar.js');
$(document).ready(function(){
  initialize();
});

var maanden = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];

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
  url: '/query/range?start=1-6-2013&end=30-6-2013'
});
var viewedMonth;

var Day = Backbone.Model.extend({
  defaults: {},
  initialize: function() {
    var reservations = new Reservations();
    this.set('reservations', reservations); // not in defaults, because then all days will share reservations
   
    // need to redirect all change events from reservation collection 
    var day = this;
    reservations.on('change', function() {/*console.log('change');*/ day.trigger('change');}); // child reservation change, propagated to collection  
    reservations.on('add',    function() {/*console.log('add');*/    day.trigger('change');});  
    reservations.on('remove', function() {/*console.log('remove');*/ day.trigger('change');});
    reservations.on('reset',  function() {/*console.log('reset');*/  day.trigger('change');});    
  }// not synced, so no url
});

var DayCellView = Backbone.View.extend({
  tagName: "div",
  className: "dayCell",
  events: {
//     "click .icon":          "open",
//     "click .button.edit":   "openEditDialog",
//     "click .button.delete": "destroy"
  },

  initialize: function() {
    console.log('init view ');
    //var el =  this.el;
    var dayModel = this.model;
    $(this.el).click( function() { selection.set('day', dayModel);} );

    this.listenTo(this.model, "change", this.render);
    this.listenTo(selection, "change:day", this.renderSelection);
    // causes lot of events on selection (one to each cell), but is elegant. TODO: optimize single event? 
  },
  renderSelection: function(selectionModel, newDay) {
    //console.log('selection changed '+this.model.get('date')+' ',selectionModel,' '+newDay.get('date')+' '+$(selection.previous('day')).attr('date'));
    if (this.model.get('date') == newDay.get('date'))
      this.$el.attr('selected','selected');
    else
      this.$el.removeAttr('selected');
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

var DayView = Backbone.View.extend({
  tagName: "div",
  className: "dayView",
  events: {},

  initialize: function() {
    this.listenTo(selection, "change:day", function(selectionModel, newSelection){ this.setModel(newSelection);});
  },
  setModel: function(model) {
    this.stopListening(this.model, "change");
    this.model = model;
    this.listenTo(this.model, "change", this.render);
    this.render();
  },
  render: function() {
    console.log('rendering dayView');
    var reservationsForDay = this.model.get('reservations'); // is a Day
    var html = '';
    reservationsForDay.each(function(res){html += '<div class="reservationLine">'+res.get("time")+' : '+res.get('name')+' ('+res.get('nrOfPeople')+')</div>';});
    html += '';
    this.$el.html(html);
    this.$el.find('.reservationLine').each(function(ix) {
      $(this).click( function() {
        selection.set('reservation',sortedReservationsForDay.models[ix]);
      });
    });
    return this;
  }
});

var ReservationView = Backbone.View.extend({
  tagName: "div",
  className: "reservationView",
  events: {},

  initialize: function() { //
    this.listenTo(selection, "change:reservation", this.render);
  },
  render: function() {
    console.log('rendering reservationView');
    var reservation = selection.get('reservation'); // doesn't have its own model
    var html = '';
    var time = name = nrOfPeople = comment = ''; 
    
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

var dayView;
var reservationView;
var days;

var Selection = Backbone.Model.extend({});
var selection = new Selection();

//TODO: need full views here? Maybe not
function handleReservationAdded(res,coll,opts) {
  //console.log('Reservation added '+res.get('name')+' date:'+res.get('date'));
  
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

function getNumberOfDaysInMonth(year,month) {
  return (new Date(year,month + 1,0)).getDate(); 
  // day is 0-based, so day 0 of next month is last day of this month (also works correctly for December.)
}

function setCurrentYearMonth(currentYear,currentMonth) {
  var nrOfDaysInPreviousMonth = getNumberOfDaysInMonth(currentYear, currentMonth-1);
  var nrOfDaysInCurrentMonth = getNumberOfDaysInMonth(currentYear, currentMonth);
  var firstDayOfMonth = ((new Date(currentYear,currentMonth,1)).getDay()+6)%7; //getDay has Sun=0 instead of Mon
  
  // note: _.range(x,y) == [x..y-1] 
  var previousMonthDates =_.range(nrOfDaysInPreviousMonth-firstDayOfMonth,nrOfDaysInPreviousMonth+1).map(function(day){
    return new Date(currentYear,currentMonth-1,day);
  });
  var currentMonthDates = _.range(1,nrOfDaysInCurrentMonth+1).map(function(day){
    return new Date(currentYear,currentMonth,day);
  });
  var nextMonthDates = _.range(1,14).map(function(day){ // will never be more than 14
    return new Date(currentYear,currentMonth+1,day);
  });
  var dates = previousMonthDates.concat(currentMonthDates).concat(nextMonthDates);

  $('#calendar .week .dayCell').each(function(ix) {
    $(this).attr('date', util.showDate(dates[ix]));
    if (dates[ix].getMonth() == currentMonth) 
      $(this).attr('isCurrentMonth', 'isCurrentMonth');
    else
      $(this).removeAttr('isCurrentMonth');
  });
  
  for (var i=0; i<days.length; i++) {
    days[i].set('date', dates[i]);
  }
}

function initialize() {
  // create dayCellViews
  var dayElts = $('#calendar .week .dayCell').toArray();

  days = $('#calendar .week .dayCell').map(function(ix) {
    $(this).attr('id','dayCell-'+ix);
    var day = new Day({date: new Date()});
    new DayCellView({model: day, el: dayElts[ix]}); // DayCellViews are not stored in a var, has not been necessary yet.
    return day;
  });
  
  dayView = new DayView({el: document.getElementById('dayView')});
  reservationView = new ReservationView({el: document.getElementById('reservationView')});
  //console.log(days[5].get('date'));
  //console.log(dayElts[5]);
  //dayCellView = new DayCellView({model: days[5], el: dayElts[5]});
  //days[5].trigger('change');
  $('.hourHeader .hour').each(function(i) {
    $(this).attr('id','hour-'+i);
    $(this).click( function() { selection.set('hour', this);} );
  });

  var today = new Date();
  
  viewedMonth = new Reservations();
  viewedMonth.on("add", handleReservationAdded);
  viewedMonth.on("remove", handleReservationRemoved);
  viewedMonth.fetch();


  selection.on('change:yearMonth', setYearMonth);
  selection.set('yearMonth', {year: today.getFullYear(), month: today.getMonth()});
  selection.set('day', _.find(days, function(day) {return util.showDate(day.get('date'))==util.showDate(today);}));
}

function setYearMonth() {
  var yearMonth = selection.get('yearMonth');
  $('#monthLabel').text(maanden[yearMonth.month]+' '+yearMonth.year);
  setCurrentYearMonth(yearMonth.year, yearMonth.month);
  // TODO: handle reservations + handlers
}

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

function logViewedMonth() {
  $('#log').empty();
  $('#log').append( JSON.stringify(viewedMonth.models) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  var martijnRes = viewedMonth.findWhere({name: 'Martijn'});
  //var newRes = new Reservation({name: 'a Name'});
  martijnRes.set('nrOfPeople',10);
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
  viewedMonth.fetch();
//  console.log(JSON.stringify(viewedMonth));
}
function refreshButton() {
  console.log('Refresh button pressed');
  viewedMonth.fetch();
  logViewedMonth();
}

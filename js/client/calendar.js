/* global util:false, io:false */


/*
 * viewedReservations is a Backbone collection that has the range of viewed calendar dates as its url
 * (which is modified when changing the month.) An array of Day objects keeps track of the reservations for 
 * each calendar cell. Add/remove listeners on viewedReservations take care of keeping reservations in the appropriate Day
 * objects.
 * 
 * Day objects propagate all add/remove/change events on the reservations collection to the day event itself.
 * 
 * Each calendar cell (DayCellView) listens to its Day object, the list of reservations (DayView) listens to the
 * the selected Day object, and the reservation view (ReservationView) listens to the currently selected Reservation. 
 * 
 * mention that Day propagates events from collection
 * 
 * mention selection
 * 
 * add  / remove
 * why doesn't date change to next month not cause an addition in other calendar the views the next month?
 * handle date change by remove/add? What if it is not inside the range? 
 * */
util.log('executing calendar.js');
$(document).ready(function(){
  initialize();
  $('#description').load("description.html", function() {
    $('#description').slideDown();
  }); 
});

// TODO: id reservationView + class res. view?  fix missing closing tag. use id for month.
/***** Globals *****/

var viewedReservations;

var selection;
var dayView;
var reservationView;
var days; // array of Days, one for each calendar cell

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


/***** Backbone models *****/

var Selection = Backbone.Model.extend({
  defaults: {
    yearMonth: {},    // :: {year :: Int, month :: Int, set by initialize()}
    day:0,            // :: Int (index in days, set by initialize())
    reservation: null // :: Reservation (not an index, since then we need to listen to changes in the selected day to update the selected reservation view, in case of deletes or inserts)
  }
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
    this.set('reservations', reservations); // not in defaults, because then all days will share a single reservations collection 
   
    // need to propagate all change events from reservations collection 
    var day = this;
    reservations.on('change', function() {/*util.log('change');*/ day.get('reservations').sort(); day.trigger('change');}); // child reservation change, propagated to collection  
    reservations.on('add',    function() {/*util.log('add');*/    day.trigger('change');});  
    reservations.on('remove', function() {/*util.log('remove');*/ day.trigger('change');});
    reservations.on('reset',  function() {/*util.log('reset');*/  day.trigger('change');});    
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
    util.log('init view ');
    var dayIndex = this.model.get('index');
    $(this.el).click( function() { 
      if (reservationView && reservationView.isChangingDate) { // handle date selection during reservation editing
        var newDate = util.showDate( days[dayIndex].get('date') );
        //alert('date change '+util.showDate(newDate));
        util.log('old date: '+selection.get('reservation').get('date'));
        selectDay(dayIndex);    
        reservationView.stopDateChange();
        util.log('new date: '+selection.get('reservation').get('date'));
        $('#dateLabel').text(newDate);
      }
      else
        selectDay(dayIndex);    
    });

    this.listenTo(this.model, "change", this.render);
    this.listenTo(selection, "change:day", this.renderSelection);
    // causes lot of events on selection (one to each cell), but is elegant. TODO: optimize single event? 
  },

  renderSelection: function(selectionModel, newDay) {
    //util.log('selection changed '+this.model.get('date')+' ',selectionModel,' '+newDay.get('date')+' '+$(selection.previous('day')).attr('date'));
    util.setAttr(this.$el, 'selected', this.model.get('index') == newDay);
  },
  render: function() {
    //util.log('rendering');
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
    this.listenTo(selection, "change:day", function(selectionModel, newSelectedIndex){ this.setModel(days[newSelectedIndex]); });
    this.listenTo(selection, "change:reservation", this.renderSelection);
  },
  setModel: function(model) { // is a Day
    this.stopListening(this.model, "change");
    this.model = model;
    this.listenTo(this.model, "change", this.render);
    this.render();
  },
  // Rather than having a subview for each reservation line, we render their selection here. 
  // This is slightly less elegant, but saves the complication of having another view.
  renderSelection: function() {
    util.log('DayView.renderSelection');
    var newReservation = selection.get('reservation');
    var $reservationLines = this.$('.reservationLine');
    var viewedDayReservations = this.model.get('reservations');
    for (var i=0; i<$reservationLines.length; i++) {
      var isSelected = viewedDayReservations.at(i) === newReservation;
      util.setAttr($($reservationLines[i]), 'selected', isSelected );
      if (isSelected)
        $('#reservationsPerDay').scrollMinimal($($reservationLines[i]));
    } 
    //util.log('DayView.renderSelection end');
  },
  render: function() {
    util.log('rendering dayView');
    var date = this.model.get('date');
    var reservationsForDay = this.model.get('reservations');
    $('#selectedDayLabel').text('Reservations for '+monthNames[date.getMonth()]+' '+date.getDate());
    var html = '';
    reservationsForDay.each(function(res){html += '<div class="reservationLine">'+res.get("time")+' : '+res.get('name')+' ('+res.get('nrOfPeople')+')</div>';});
    this.$el.find('#reservationsPerDay').html(html);
    this.$el.find('.reservationLine').each(function(ix) {
      $(this).click( function() {
        selectReservation(reservationsForDay.models[ix]);
      });
    });
    //util.log('end rendering dayView');
    this.renderSelection();
    return this;
  }
});

// Selected reservation
var ReservationView = Backbone.View.extend({
  tagName: "div",
  className: "reservationView",
  
  isEditing: false,
  isChangingDate: false,
  originalDate: '',
  originalMonth: null,
  
  initialize: function() {
    this.listenTo(selection, "change:reservation", function(selectionModel, newSelection){
      util.log('ReservationView change:reservation'); this.setModel(newSelection);
    });
        
    var view = this;
    this.$('#deleteButton').click(function() {deleteReservation(view.model);});
    this.$('#editButton').click(function() {view.startEditing();});
    this.$('#cancelButton').click(function() {view.cancelEditing();});
    this.$('#saveButton').click(function() {view.saveModel(); view.stopEditing();});
    this.$('#dateChangeButton').click(function() {view.startDateChange();});
    this.$('#cancelDateChangeButton').click(function() {view.stopDateChange();});
    this.render();
  },
  setModel: function(res) {
    if (this.model)
      this.stopListening(this.model, "change");
    this.model = res;
    if (this.model)
      this.listenTo(this.model, "change", this.render);
    this.render();
  },
  startEditing: function() {
    // save the original yearMonth and day selections, since a date change may change them (and we need to set them back on cancel)
    this.selectedYearMonthBeforeEditing = selection.get('yearMonth');
    this.selectedDayBeforeEditing = selection.get('day');
    this.isEditing = true;
    this.render();
  },
  stopEditing: function() {
    this.isEditing = false;
    this.render();
  },
  cancelEditing: function() {
    this.isEditing = false;
    selection.set('yearMonth', this.selectedYearMonthBeforeEditing);
    selection.set('day', this.selectedDayBeforeEditing); // don't use selectDay, since we don't want to change selected reservation
    this.render();
  },
  saveModel: function() {
    this.model.set({ time: this.$('#timeSelector').val()   
                   , date: this.$('#dateLabel').text()
                   , name: this.$('#nameField').val()   
                   , nrOfPeople: parseInt(this.$('#nrOfPeopleSelector').val())   
                   , comment: this.$('#commentArea').val() });
    this.model.save();
  },
  startDateChange: function() {
    // changing the date is done by the click handler for DayCellView
    this.isChangingDate = true; 
    this.$('#dateChangeOverlay').show();
  },
  stopDateChange: function() {
    this.isChangingDate = false;
    this.$('#dateChangeOverlay').hide();
  },
  render: function() {
    util.log('rendering reservationView');
    
    this.$('.nonEditable').toggle(!this.isEditing); // show either .nonEditable
    this.$('.editable').toggle(this.isEditing);   // or .editable
    
    var reservation = this.model; 
    var html = '';
    var time = '';
    var date = '';
    var name = '';
    var nrOfPeople = '';
    var comment = ''; 
    
    if (reservation) {
      time = reservation.get('time');
      date = reservation.get('date');
      name = reservation.get('name');
      nrOfPeople = reservation.get('nrOfPeople');
      comment = reservation.get('comment');
    }  
    html += 'Name: <span class="info">'+name+'</span><br/>';
    html += 'Time: <span class="info">'+time+'</span><br/>';
    html += 'Nr. of people: <span class="info">'+nrOfPeople+'</span><br/>';
    html += 'Comment:<br/><div class="commentView info">';
    html += comment;
    html += '</div>';
    this.$(".nonEditable > #reservationPres").html(html);
    
    this.$('#timeSelector').attr('value', time);
    this.$('#dateLabel').text(date);
    this.$('#nameField').attr('value', name);
    this.$('#nrOfPeopleSelector').attr('value', nrOfPeople);
    this.$('#commentArea').attr('value', comment);
    
    util.setAttr(this.$('#deleteButton'), 'disabled', !this.model); // disable if no reservation selected
    util.setAttr(this.$('#editButton'), 'disabled', !this.model); // disable if no reservation selected
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
    var day = new Day({index: ix, date: new Date()});
    new DayCellView({model: day, el: dayElts[ix]}); // DayCellViews are not stored in a var, has not been necessary yet.
    return day;
  });
  
  dayView = new DayView({el: document.getElementById('dayView')});
  
  reservationView = new ReservationView({el: document.getElementById('reservationView')});
  
  var today = new Date();
  //today = new Date(2013,7,4);
  
  viewedReservations = new Reservations();
  viewedReservations.on('add',    function(res,coll,opts) { addReservationToDays(res);      });
  viewedReservations.on('remove', function(res,coll,opts) { removeReservationFromDays(res); });
  viewedReservations.on('change', function(res,opts)      { updateReservationInDays(res);   });
  selection.on('change:yearMonth', setSelectedYearMonth);
  selection.set('yearMonth', {year: today.getFullYear(), month: today.getMonth()});
  
  var dayDates = _.map(days, function(day) {return util.showDate(day.get('date'));});
  selectDay(dayDates.indexOf(util.showDate(today)));
  $(".month").focus();
  $(".month").keydown(monthKeyHandler);
  $("#reservationsPerDay").keydown(reservationsPerDayKeyHandler);
  initRefreshSocket();
}

/* Use server-side push to refresh calendar. For simplicity, push event does not contain the changes,
 * but triggers a backbone fetch. */
function initRefreshSocket() {
  //util.log(location.host);
  var socket = io.connect('http://'+location.host);
  socket.on('refresh', function (data) {
    util.log('Refresh pushed');
    refresh();
  });
}

/***** Event handlers *****/

function refresh() {
  viewedReservations.fetch();
}

function isNavigationAllowed() {
  if (!(reservationView && reservationView.isChangingDate) &&reservationView && reservationView.isEditing ) {
    if (confirm('Save changes to reservation?')) {
      reservationView.saveModel();
      reservationView.stopEditing();
      return true;
    }
    else
      return false; // user pressed cancel, so no navigation
  } else
    return true; // no editing, so always allow navigation
}

function selectDay(selectedDayIndex) {
  if (isNavigationAllowed()) {
    selection.set('day', selectedDayIndex);

    // select first reservation, if there is one
    if (!(reservationView && reservationView.isChangingDate))
      selectReservation( days[selectedDayIndex].get('reservations').length > 0 
                       ? days[selectedDayIndex].get('reservations').at(0)
                       : null );
  }
}

function selectReservation(selectedReservation) {
//  util.log('selected: '+selectedReservation);
  if (isNavigationAllowed())
    selection.set('reservation',selectedReservation);
}

// TODO: handle reservations + handlers (note: maybe this has been done already)
function setSelectedYearMonth() {
  var yearMonth = selection.get('yearMonth');
  var currentYear =yearMonth.year;
  var currentMonth = yearMonth.month;
  while (viewedReservations.length) // remove all viewed reservations
    viewedReservations.pop();

  $('#prevMonthButton').attr('value', monthNames[(new Date(currentYear,currentMonth-1,1)).getMonth()] );
  $('#nextMonthButton').attr('value', monthNames[(new Date(currentYear,currentMonth+1,1)).getMonth()] );
  $('#monthLabel').text(monthNames[yearMonth.month]+' '+yearMonth.year);

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
    util.setAttr( $(this), 'isCurrentMonth', dates[ix].getMonth() == currentMonth);
  });
  
  for (var i=0; i<days.length; i++) {
    days[i].set('date', dates[i]);
  }
  
  viewedReservations.url = '/query/range?start='+util.showDate(dates[0])+'&end='+util.showDate(dates[6*7-1]);
  //util.log('url:'+'/query/range?start='+util.showDate(dates[0])+'&end='+util.showDate(dates[6*7-1]));
  viewedReservations.fetch({success: function() {selectDay(selection.get('day'));}});
  // after all reservations have been fetched, we select the day again to select the first reservation of the day.
}

// todo: set initial day + handle month jumps
function monthKeyHandler(event) {
  util.log('monthKeyHandler');
  if (event.keyCode >= 37 && event.keyCode <= 40) {
    var selectedIndex = selection.get('day');
    //util.log('selectedIx: '+ selectedIx);
    switch (event.keyCode) {
    case 37:
      util.log('day left');
      selectedIndex -= 1;
      break;
    case 38:
      util.log('day up');
      selectedIndex -= 7;
      break;
    case 39:
      util.log('day right');
      selectedIndex += 1;
      break;
    case 40:
      util.log('day down');
      selectedIndex += 7;
      break;
    }
    var yearMonth = selection.get('yearMonth');
    if (selectedIndex < 0) {
      selectedIndex += 6*7;
      selection.set('yearMonth', {year: yearMonth.year, month: yearMonth.month - 1});
    }
    else if (selectedIndex >= 6*7) {
      selectedIndex -= 6*7;
      selection.set('yearMonth', {year: yearMonth.year, month: yearMonth.month + 1});
    }
    selectDay(selectedIndex);
    event.preventDefault();
  }
}

function reservationsPerDayKeyHandler(event) {
  util.log('keyCode '+event.keyCode);
  if (event.keyCode == 8) {
    deleteReservation( selection.get('reservation') );
    event.preventDefault();    
  } else if (event.keyCode == 38 || event.keyCode == 40) {
    var selectedDay = days[selection.get('day')];
    var selectedIx = selectedDay.get('reservations').indexOf( selection.get('reservation') );
    var nrOfReservations = selectedDay.get('reservations').length;
    
    if (selectedIx==-1) {
      if (nrOfReservations > 0)
        selectedIx = 0;  // when selection was -1 and we have reservations, select first one, otherwise keep it at -1
    } else {
      switch (event.keyCode) {
      case 38:
        //util.log('reservation up: '+selectedIx);
        selectedIx = selectedIx > 0 ? selectedIx - 1 : 0;
        break;
      case 40:
        //util.log('reservation down: '+selectedIx);
        selectedIx = selectedIx < nrOfReservations -1 ? selectedIx + 1 : nrOfReservations - 1;
        break;
      }
    }
    selectReservation( selectedDay.get('reservations').at(selectedIx) );
    event.preventDefault();
  }
}

function deleteReservation(reservation) {
  if (confirm('Are you sure you wish to delete the reservation for '+reservation.get('name')+'?') ) {
    var selectedDay = days[selection.get('day')];
    var selectedIx = selectedDay.get('reservations').indexOf( selection.get('reservation') );
    if ( reservationView && reservationView.isEditing &&               
         selectedDay.get('reservations').at(selectedIx) == reservation )
   // if we're editing and the reservation to be deleted is the one edited (== the selected reservation) then
   // stop editing. (second check not yet necessary, since we can only deleted the selected reservation)
      reservationView.stopEditing();
    //console.log('index:'+selectedIx);
    reservation.destroy();
    var nrOfRemainingRess = selectedDay.get('reservations').length;
    //util.log(nrOfRemainingRess+' '+selectedIx);
    var newSelection = nrOfRemainingRess == 0 ? null 
                                              : selectedDay.get('reservations').at( Math.min(selectedIx, nrOfRemainingRess-1) );
    selection.set('reservation', newSelection );  
  }
}

/***** Button handlers *****/

function prevMonthButton() {
  util.log('Prev month button pressed');
  if (isNavigationAllowed()) {
    var yearMonth = selection.get('yearMonth');
    var currentYearMonth = new Date(yearMonth.year, yearMonth.month-1,1);
    selection.set('yearMonth', {year: currentYearMonth.getFullYear(), month: currentYearMonth.getMonth()});
  }
}

function nextMonthButton() {
  util.log('Next month button pressed');
  if (isNavigationAllowed()) {
    var yearMonth = selection.get('yearMonth');
    var currentYearMonth = new Date(yearMonth.year, yearMonth.month+1,1);
    selection.set('yearMonth', {year: currentYearMonth.getFullYear(), month: currentYearMonth.getMonth()});
  }
}


/***** Utils *****/

function getNumberOfDaysInMonth(year,month) {
  return (new Date(year,month + 1,0)).getDate(); 
  // day is 0-based, so day 0 of next month is last day of this month (also works correctly for December.)
}

// Return the day object from days array that corresponds to the argument date
function getDayForDate(date) {
  // have to use find instead of findWhere, since the date needs to be converted
  return _(days).find(function(day){return util.showDate(day.get('date'))==date;});
}

function addReservationToDays(res) {
  //util.log('addReservationToDays '+res.get('name')+' date:'+res.get('date'));
  //for (var i=0;i<days.length; i++) util.log(days[i].get('date'));
  var correspondingDay = getDayForDate( res.get('date') );
  //util.log('correspondingDay = '+correspondingDay.get('date'));
  correspondingDay.get('reservations').add(res);
}

function removeReservationFromDays(res) {
  //util.log('removeReservationFromDays '+res.get('name')+' date:'+res.get('date'));
  var correspondingDay = getDayForDate( res.get('date') );
  correspondingDay.get('reservations').remove(res);
}

function updateReservationInDays(res) {
  //util.log('updateReservationInDays '+res.get('name')+' date:'+res.get('date'));
  //correspondingDay.get('reservations').remove(res);
  if (res.changedAttributes().hasOwnProperty('date')) { // only have to do something if date changed
    var oldDay = getDayForDate( res.previous('date') );
    oldDay.get('reservations').remove(res);
    var newDay = getDayForDate( res.get('date') );
    newDay.get('reservations').add(res);
  }
}


/***** Debug *****/

function logViewedReservations() {
  $('#log').empty();
  $('#log').append( JSON.stringify(viewedReservations.models) +'<br/>');
}
function testButton1() {
  util.log('Test button 1 pressed');
  var martijnRes = viewedReservations.findWhere({name: 'Martijn'});
  //var newRes = new Reservation({name: 'a Name'});
  martijnRes.set('nrOfPeople',10);
  //util.log(JSON.stringify(viewedReservations));
}

function testButton2() {
  util.log('Test button 2 pressed, create');
//  viewedReservations.create({name:'Ieniemienie', date: '1-6-2013', nrOfPeople: 2});
  while (viewedReservations.length)
    viewedReservations.pop();
  viewedReservations.url = '/query/range?start=1-7-2013&end=11-8-2013';
}
function testButton3() {
  util.log('Test button 3 pressed, fetch');
  //viewedReservations.remove(viewedReservations.findWhere({name: 'Ieniemienie'}));
  //util.log('url:'+'/query/range?start='+util.showDate(dates[0])+'&end='+util.showDate(dates[6*7-1]));
  viewedReservations.fetch();
  util.log( 'viewedReservations.length '+viewedReservations.length );
//  util.log(JSON.stringify(viewedReservations));
}
function resetButton() {
  $.get('/reset', function() {
    alert('Database has been reset.');
    });
}
function refreshButton() {
  util.log('Refresh button pressed');
  viewedReservations.fetch();
  logViewedReservations();
}

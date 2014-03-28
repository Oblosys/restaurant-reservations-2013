/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/backbone/backbone.d.ts" />
/// <reference path="../typings/underscore/underscore.d.ts" />
/// <reference path="../typings/socket.io-client.d.ts" />
/// <reference path="../typings/oblo-util/oblo-util.d.ts" />

util.log('executing reservationTS.js');
$(document).ready(function() {
  initialize();
  $('#description').load("description.html", function() {
    $('#description').show();
  });
});


/***** Globals *****/


var restaurantInfo;

var reservationsThisWeek;

var currentReservation;


/***** Backbone models *****/

var RestaurantInfo =  Backbone.Model.extend({
  defaults: { 
    maxNrOfPeople: 0
  },
  urlRoot: 'query/restaurantInfo'
});

var Reservation = Backbone.Model.extend({
  defaults: {
    date: '',
    time: '',
    name: '',
    nrOfPeople: 0,
    comment: ''
  },
  initialize: function() {
    this.on("change", disenableConfirmButton);
  },
  urlRoot: '/model/reservation'
});

var Reservations = Backbone.Collection.extend({
  model: Reservation,
  url: ''
});


/***** Init ****/

function initialize() {
  util.log('initializing');
  
  restaurantInfo = new RestaurantInfo();
  restaurantInfo.fetch({success: function() {
    disenableTimeButtons();
  }});

  currentReservation = new Reservation();
  
  ////// Name 
  $('#name-field').keyup(function() {
    currentReservation.set('name', $(this).val());  
  });
  currentReservation.on('change:name', function(r,newName) {
    $('#name-field').val(newName); // only triggers change event if value actually changed, so no loops will
                                  // occur, even if we bind the handler above to .changed
  });
  
  ////// Number of people
  setLabelOn($('#nr-of-people-label'), currentReservation, 'nrOfPeople','Number of people: ', 'Please select nr. of people.');
  var $nrOfPeopleButtons = $('.nr-of-people-buttons input');
  $nrOfPeopleButtons.each(function(i) {
    var $button = $(this);
    currentReservation.on('change:nrOfPeople', function(r,newNrOfPeople) {
      util.setAttr($button, 'selected', newNrOfPeople == i+1);
      disenableTimeButtons();
    });

    $(this).click(function() {
      currentReservation.set('nrOfPeople', i+1);
    });
  });

  ////// Date
  setLabelOn($('#date-label'), currentReservation, 'date','Date: ', 'Please select a date.');
  var today = new Date();
  var dayLabels = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
  var dateLabels = ['Today ('+util.showDate(today)+')','Tomorrow'];
  var weekDay = today.getDay(); // 0 is Sunday
  for (var d=0; d<6; d++)
    dateLabels.push(dayLabels[(d+weekDay+2)%7]);
  var $dateButtons = $('.large-day-buttons input,.small-day-buttons input');
  $dateButtons.each(function(i) {
    $(this).attr('value', dateLabels[i]);
 
    var buttonDate = new Date(today);
    buttonDate.setDate( today.getDate() + i );
    var $button = $(this);
    currentReservation.on('change:date', function(r,newDate) {
      util.setAttr($button, 'selected', newDate == util.showDate(buttonDate));
      disenableTimeButtons();
    });
    
    $(this).click(function() {
      currentReservation.set('date', util.showDate(buttonDate));
    });
  });
  
  ////// Time
  setLabelOn($('#time-label'), currentReservation, 'time','Time: ', 'Please select a time.');
  var timeLabels = [];
  for (var hr=18; hr<25; hr++) {
    timeLabels.push(hr+':00');
    timeLabels.push(hr+':30');
  }
  
  var $timeButtons = $('.time-buttons input');
  $timeButtons.each(function(i) {
    $(this).attr('value', timeLabels[i]);
   
    var $button = $(this);
    currentReservation.on('change:time', function(r,newTime) {
      util.setAttr($button, 'selected', newTime == timeLabels[i]);
    });
    $(this).click(function() {
      currentReservation.set('time', timeLabels[i]);
    });
  });
  
  reservationsThisWeek = new Reservations();
  var lastDay = new Date(today); 
  // Just assume first day is today, even it's midnight and a new day starts while making the reservation
  
  lastDay.setDate( today.getDate() + 7);
  reservationsThisWeek.url = '/query/range?start='+util.showDate(today)+'&end='+util.showDate(lastDay);
  reservationsThisWeek.fetch({success: function() {
    reservationsThisWeek.on("change", disenableTimeButtons);
    reservationsThisWeek.on("add", disenableTimeButtons);
    reservationsThisWeek.on("remove", disenableTimeButtons);
    currentReservation.trigger('change');
    
    currentReservation.trigger('change:name');       // clear ui text field (in case of a reload)  
    currentReservation.trigger('change:nrOfPeople'); // and disenable buttons according to newly fetched reservations
    // would be nice to just trigger 'change', but that does not trigger the sub events
  }});
  
  initRefreshSocket();
}

/* Use server-side push to refresh calendar. For simplicity, push event does not contain the changes,
 * but triggers a backbone fetch. */

function initRefreshSocket() {
  var socket = io.connect('http://'+location.host);
  socket.on('refresh', function (data) {
    util.log('Refresh pushed');
    refresh();
  });
}

/***** Event handlers *****/

function refresh() {
  util.log('fetching');
  reservationsThisWeek.fetch();
}


/***** Button handlers *****/

/*
 * Could be improved by also having a check for availability at server side.
 * */
function confirmButton() {
  var newReservation = currentReservation.clone(); // submit a clone, to prevent having to reinitialize listeners
  reservationsThisWeek.fetch({success: function() {    
    // NOTE: make sure not to block this with an alert. On Firefox, if fetch success does not complete, the fetch 
    // network communication does not finish, and fetches in other open windows/tabs will not be executed.
    if (isValidReservation(currentReservation)) {
      newReservation.set('comment', $('#comment-area').val()); // comment area is not kept in model, since it may stay empty
      newReservation.save({},{
        success: function(){
          alert('Your reservation for '+newReservation.get('nrOfPeople')+' person'+(newReservation.get('nrOfPeople')=='1' ? '' : 's')+
              ', on '+newReservation.get('date')+' at '+newReservation.get('time')+' has been confirmed.');
          currentReservation.clear();
        },
        error: function() {
          alert('Reservation failed: server error');
        }
      });
    }
    else {
      alert('Reservation failed: the selected time ('+newReservation.get('date')+' at '+newReservation.get('time')+') is no longer available.');
//      console.error('confirmButton: invalid reservation '+JSON.stringify(currentReservation));
    }
  }});
}


/***** Utils *****/

function isValidReservation(res) {
  return _.isString(res.get('date'))       && res.get('date') != '' &&
         _.isString(res.get('time'))       && res.get('time') != '' &&
         _.isString(res.get('name'))       && res.get('name') != '' &&
         _.isNumber(res.get('nrOfPeople')) && res.get('nrOfPeople') != 0;
  // note: a !== '' means !_.isString(a) || a!='', so we need the isString explicitly
}

function setLabelOn($label, model, prop, setMsg, unsetMsg) {
  model.on('change:'+prop, function(r,newVal) { 
  if (newVal)
    $label.text(setMsg+newVal);
  else
    $label.text(unsetMsg);
});
}


/***** Disenabling *****/

function disenableConfirmButton() {
  //util.log('valid:'+isValidReservation(currentReservation));
  document.getElementById('confirm-button').disabled = !isValidReservation(currentReservation);
}

/* can be called before buttons are set up, so needs to work correctly in that case */
function disenableTimeButtons() {
  util.log('disenableTimeButtons');
  var curDate = currentReservation.get('date');
  var curTime = currentReservation.get('time');
  var curNr = currentReservation.get('nrOfPeople');
  var ressForDate = reservationsThisWeek.where({date: curDate}); // date=='' yields empty ressForDate
  var nrOfPeopleAtTime = [];
  _.each(ressForDate, function(res){
    var t = res.get('time');
    if (!nrOfPeopleAtTime[t])
      nrOfPeopleAtTime[t] = 0;
    nrOfPeopleAtTime[t] += res.get('nrOfPeople');
  });
  //util.log(nrOfPeopleAtTime);
  var $timeButtons = $('.time-buttons input');
  $timeButtons.each(function() {
    var tm = $(this).val();
    if (!nrOfPeopleAtTime[tm] || nrOfPeopleAtTime[tm] + curNr <= restaurantInfo.get('maxNrOfPeople'))
      util.setAttr($(this), 'disabled', false);
    else {
      util.setAttr($(this), 'disabled', true);
      if (curTime==tm)
        currentReservation.set('time','');
    }
  });
}


/***** Debug *****/

function log() {
  $('#log').empty();
  $('#log').append( JSON.stringify(currentReservation) +'<br/>'+
                    JSON.stringify(reservationsThisWeek) +'<br/>');
}

function testButton1() {
  util.log('Test button 1 pressed');
  log();
}
function testButton2() {
  currentReservation.clear();

  util.log('Test button 2 pressed, create');
}
function testButton3() {
  util.log('Test button 3 pressed, remove');
  disenableTimeButtons();
}
function testButton4() {
  util.log('Test button 4 pressed, fetch');
  reservationsThisWeek.fetch();
}
function refreshButton() {
  util.log('Refresh button pressed');
}

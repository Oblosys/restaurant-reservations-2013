/* global util:false */
var maxNrOfPeople = 12; // todo: obtain from server

/* - fix namefield + disable status on reload (force a present)
 * - don't allow confirm before reservations are fetched (doesn't work yet)
 * LATER: check if update on reservation is handled correctly here and in calendar (not a normal scenario yet)
 */
console.log('executing reservation.js');
$(document).ready(function(){
  initialize();
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
var reservationsThisWeek;

var currentReservation;

function initialize() {
  console.log('initializing');
  currentReservation = new Reservation();
  
  $('#nameField').keyup(function() {
    currentReservation.set('name', $(this).val());  
  });
  currentReservation.on('change:name', function(r,newName) {
    $('#nameField').val(newName); // only triggers change event if value actually changed, so no loops will
                                  // occur, even if we bind the handler above to .changed
  });
  
  var $nrOfPeopleButtons = $('.NrOfPeopleButtons input');
  $nrOfPeopleButtons.each(function(i) {
    var $button = $(this);
    currentReservation.on('change:nrOfPeople', function(r,newSelection) {
      if (newSelection == i+1)
        $button.attr('selected','selected');
      else
        $button.removeAttr('selected');
      disenableTimeButtons();
    });

    $(this).click(function() {
      currentReservation.set('nrOfPeople', i+1);
    });
  });
  
  var today = new Date();
  var dayLabels = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
  var dateLabels = ['Today ('+util.showDate(today)+')','Tomorrow'];
  var weekDay = today.getDay(); // 0 is Sunday
  for (var d=0; d<6; d++)
    dateLabels.push(dayLabels[(d+weekDay+2)%7]);
  var $dateButtons = $('.LargeDayButtons input,.SmallDayButtons input');
  $dateButtons.each(function(i) {
    
    $(this).attr('value', dateLabels[i]);
 
    var buttonDate = new Date(today);
    buttonDate.setDate( today.getDate() + i );
    var $button = $(this);
    currentReservation.on('change:date', function(r,newDate) {
      if (newDate == util.showDate(buttonDate))
        $button.attr('selected','selected');
      else
        $button.removeAttr('selected');
      
      disenableTimeButtons();
    });
    
    $(this).click(function() {
      currentReservation.set('date', util.showDate(buttonDate));
    });
  });
  
  var timeLabels = [];
  for (var hr=18; hr<25; hr++) {
    timeLabels.push(hr+':00');
    timeLabels.push(hr+':30');
  }
  
  var $timeButtons = $('.TimeButtons input');
  $timeButtons.each(function(i) {
    $(this).attr('value', timeLabels[i]);
   
    var $button = $(this);
    currentReservation.on('change:time', function(r,newTime) {
      if (newTime == timeLabels[i])
        $button.attr('selected','selected');
      else
        $button.removeAttr('selected');
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
}

function isValidReservation(res) {
  return res.get('date') != '' &&
         res.get('time') != '' &&
         res.get('name') != '' &&
         res.get('nrOfPeople') != 0;
}

/*
 * Could be improved by also having a check for availability at server side.
 * */
function confirmButton() {
  var newReservation = currentReservation.clone(); // submit a clone, to prevent having to reinitialize listeners
  reservationsThisWeek.fetch({success: function() {    
    if (isValidReservation(currentReservation)) {
      newReservation.set('comment', $('#commentArea').val()); // comment area is not kept in model, since it may stay empty
      newReservation.save();
      currentReservation.clear();
      alert('Your reservation for '+newReservation.get('nrOfPeople')+' person'+(newReservation.get('nrOfPeople')=='1' ? '' : 's')+
            ', on '+newReservation.get('date')+' at '+newReservation.get('time')+' has been confirmed.');
    }
    else {
      alert('Reservation failed: the selected time ('+newReservation.get('date')+' at '+newReservation.get('time')+') is no longer available.');
//      console.error('confirmButton: invalid reservation '+JSON.stringify(currentReservation));
    }
  }});
  log();
}

function disenableConfirmButton() {
  //console.log('valid:'+isValidReservation(currentReservation));
  document.getElementById('confirmButton').disabled = !isValidReservation(currentReservation);
}
function disenableTimeButtons() {
  console.log('disenableTimeButtons');
  var curDate = currentReservation.get('date');
  var curTime = currentReservation.get('time');
  var curNr = currentReservation.get('nrOfPeople');
   var ressForDate = reservationsThisWeek.where({date: curDate}); // date=='' yields empty ressForDate
  var nrOfPeopleAtTime = []
  _.each(ressForDate, function(res){
    var t = res.get('time');
    if (!nrOfPeopleAtTime[t])
      nrOfPeopleAtTime[t] = 0;
    nrOfPeopleAtTime[t] += res.get('nrOfPeople');
  });
  console.log(nrOfPeopleAtTime);
  var $timeButtons = $('.TimeButtons input');
  $timeButtons.each(function() {
    var tm = $(this).val();
    if (!nrOfPeopleAtTime[tm] || nrOfPeopleAtTime[tm] + curNr <= maxNrOfPeople)
      $(this).removeAttr('disabled');
    else {
      $(this).attr('disabled','disabled');
      if (curTime==tm)
        currentReservation.set('time','');
    }
  });
}
function log() {
  $('#log').empty();
  $('#log').append( JSON.stringify(currentReservation) +'<br/>'+
                    JSON.stringify(reservationsThisWeek) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  log();
}
function testButton2() {
  currentReservation.clear();

  console.log('Test button 2 pressed, create');
}
function testButton3() {
  console.log('Test button 3 pressed, remove');
  disenableTimeButtons();
}
function testButton4() {
  console.log('Test button 4 pressed, fetch');
  reservationsThisWeek.fetch();
}
function refreshButton() {
  console.log('Refresh button pressed');
}

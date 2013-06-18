/* global util:false */
var maxNrOfPeople = 12;

/*
 * - don't allow confirm before reservations are fetched
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
var reservationsToday;

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
  
  reservationsToday = new Reservations();
  var lastDay = new Date(today); 
  // Just assume first day is today, even it's midnight and a new day starts while making the reservation
  
  lastDay.setDate( today.getDate() + 7);
  reservationsToday.url = '/query/range?start='+util.showDate(today)+'&end='+util.showDate(lastDay);
  reservationsToday.fetch({success: function() {
    console.log('done');
    reservationsToday.on("change", disenableTimeButtons);
    reservationsToday.on("add", disenableTimeButtons);
    reservationsToday.on("remove", disenableTimeButtons);
    disenableTimeButtons();
  }});
}

function isValidReservation(res) {
  return res.get('date') != '' &&
         res.get('time') != '' &&
         res.get('name') != '' &&
         res.get('nrOfPeople') != 0;
}

function confirmButton() {
  if (isValidReservation(currentReservation)) {
    var newReservation = _.clone(currentReservation); // submit a clone, to prevent having to reinitialize listeners
    newReservation.set('comment', $('#commentArea').val()); // comment area is not kept in model, since it may stay empty
    newReservation.save();
    currentReservation.clear();
  }
  else {
    console.error('confirmButton: invalid reservation '+JSON.stringify(currentReservation));
  }
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
   var ressForDate = reservationsToday.where({date: curDate}); // date=='' yields empty ressForDate
  console.log('bla'+JSON.stringify(ressForDate.length));
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
                    JSON.stringify(reservationsToday) +'<br/>');
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
  reservationsToday.fetch();
}
function refreshButton() {
  console.log('Refresh button pressed');
}

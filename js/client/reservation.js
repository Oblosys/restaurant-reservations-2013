/* global util:false */


console.log('executing reservation.js');
$(document).ready(function(){
  initialize();
});

var Reservation = Backbone.Model.extend({
  clear: function() {
    this.set('date', '');
    this.set('time', '');
    this.set('name', '');
    this.set('nrOfPeople', 0);
    this.set('comment', '');
  },
  initialize: function() {
    this.clear();
    this.on("change", disenableButtons);
  },
  urlRoot: '/model/reservation'
});

var Reservations = Backbone.Collection.extend({
  model: Reservation,
  url: '/query/range?start=17-6-2013&end=17-6-2013'
});
var reservationsToday;

var currentReservation;

function initialize() {
  console.log('initializing');
  currentReservation = new Reservation();
  
  $('#nameField').keyup(function() {
    currentReservation.set('name', $(this).val());
  });
  
  var $nrOfPeopleButtons = $('.NrOfPeopleButtons input');
  $nrOfPeopleButtons.each(function(i) {
    $(this).click(function() {
      currentReservation.set('nrOfPeople', i);
      $nrOfPeopleButtons.removeAttr('selected');
      $(this).attr('selected','selected');
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
    var buttonDate = new Date(today);
    buttonDate.setDate( today.getDate() + i );
    $(this).attr('value', dateLabels[i]);
    $(this).click(function() {
      currentReservation.set('date', util.showDate(buttonDate));
      $dateButtons.removeAttr('selected');
      $(this).attr('selected','selected');
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
      //$timeButtons.removeAttr('selected');
      //$(this).attr('selected','selected');
    });
  });
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

function disenableButtons() {
  console.log('valid:'+isValidReservation(currentReservation));
  document.getElementById('confirmButton').disabled = !isValidReservation(currentReservation);
}

function log() {
  $('#log').empty();
  $('#log').append( JSON.stringify(currentReservation) +'<br/>');
}
function testButton1() {
  console.log('Test button 1 pressed');
  disenableButtons();
  log();
}
function testButton2() {
  currentReservation.clear();

  console.log('Test button 2 pressed, create');
}
function testButton3() {
  console.log('Test button 3 pressed, remove');
}
function testButton4() {
  console.log('Test button 4 pressed');
}
function refreshButton() {
  console.log('Refresh button pressed');
}

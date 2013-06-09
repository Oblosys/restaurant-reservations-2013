console.log('executing calendar.js');
$(document).ready(function(){
  initialize();
});

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
    console.log('blaa:'+$(this));
  });
  $('.hourHeader .hour').each(function(i) {
    $(this).attr('id','hour-'+i);
    $(this).click( function() { selection.set('hour', this);} );
  });
}

function clickDay(day) {
  selection.set('day', day);
}
function testButton() {
  console.log('Test button pressed');
 }

console.log('executing reservations.js');
$(document).ready(function(){
  initialize();
});

var data = {x:1, y:2, z:3};

function refresh() {
  $('#field1X').val(data.x);
  $('#field1Y').val(data.y);
  $('#field1Z').val(data.z);
  $('#field2X').val(data.x);
  $('#field2Y').val(data.y);
  $('#field2Z').val(data.z);
}

function initialize() {
  refresh();
}


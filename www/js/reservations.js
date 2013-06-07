console.log('executing reservations.js');
$(document).ready(function(){
  initialize();
});

function Data() {
  this.x = 1;
  this.y = 2;
  this.z = 3;
  this.setX = function( x ) {
    this.x = x;
    this.trigger("change:x",x);
  };
  this.setY = function( y ) {
    this.y = y;
    this.trigger("change:y",y);
  };
  this.setZ = function( z ) {
    this.z = z;
    this.trigger("change:z",z);
  };
}

var data = new Data;
_.extend(data, Backbone.Events);

function initialize() {
  data.on("change:x",changeHandler,$('#field1X'));
  data.on("change:y",changeHandler,$('#field1Y'));
  data.on("change:z",changeHandler,$('#field1Z'));
  data.on("change:x",changeHandler,$('#field2X'));
  data.on("change:y",changeHandler,$('#field2Y'));
  data.on("change:z",changeHandler,$('#field2Z'));
}

function changeHandler(newVal) {
  $(this).val(newVal);
  //console.log(data.x+' '+data.y+' '+data.z);
}



console.log('executing reservations.js');
$(document).ready(function(){
  initialize();
});

var Data = Backbone.Model.extend({
  defaults: {
    x: 1,
    y: 2,
    z: 3 
  } 
});

var data = new Data;

function initialize() {
  initObserver(data, 'x', $('#field1X'));
  initObserver(data, 'y', $('#field1Y'));
  initObserver(data, 'z', $('#field1Z'));
  initObserver(data, 'x', $('#field2X'));
  initObserver(data, 'y', $('#field2Y'));
  initObserver(data, 'z', $('#field2Z'));
  console.log('data.get '+data.get('x'));
  data.set('x',$('#field1X').val());
}

function initObserver(model, prop, elt) {
  elt.val(model.get(prop));
  model.on("change:"+prop,changeHandler,elt);
}

function changeHandler(model,newVal) {
  this.val(newVal);
  console.log(model.get('x'));
}

function saveButton() {
  data.save();
}

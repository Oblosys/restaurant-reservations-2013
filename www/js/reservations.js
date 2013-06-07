console.log('executing reservations.js');
$(document).ready(function(){
  initialize();
});

var Data = Backbone.Model.extend({
  defaults: {
    x: 1,
    y: 2,
    z: 3 
  },
  url: 'model'
});

var data = new Data;

function initialize() {
  data.fetch();

  registerEditor(data, 'x', $('#field1X'));
  registerEditor(data, 'y', $('#field1Y'));
  registerEditor(data, 'z', $('#field1Z'));
  registerEditor(data, 'x', $('#field2X'));
  registerEditor(data, 'y', $('#field2Y'));
  registerEditor(data, 'z', $('#field2Z'));
//  console.log('data.get '+data.get('x'));
}
function registerEditor(model, prop, elt) {
  var $elt = $(elt);
  $elt.change( function () { model.set(prop,$elt.val()); } );
  initObserver(model,prop,$elt);

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
  console.log(data.toJSON());
  data.save();
}

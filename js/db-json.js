var _        = require('underscore')
  , util =     require('oblo-util');

var dbInfo = {}; // dummy object, not used for json database

/* Basic CRUD server that stores models in root.<modelname>.models and keeps track of id counter */
var root = 
  { //reservation: { idCounter: 10, models: [{id: "reservation-1", name: "Pino", date: "4-6-2013"},{id: "reservation-2", name: "Tommie", date: "5-6-2013"}]}
  //, book:        { idCounter:100, models: [{id: "book-1", title: "Oblomov"},{id: "book-2", title: "War and peace"}]}            
  };

var changeHandler = null;

// todo: maybe create html errors? (need to pass res)

function initDb() {
  root = {};
}

function onChange(newChangeHandler) {
  changeHandler = newChangeHandler;
}

function dbChanged() {
  if (changeHandler)
    changeHandler();
}

function resetDb(cont) {
  root = {};
  if (cont)
    cont();
}

function readModel(type, id, cont) {
  console.log('\nREAD: type:'+type+' id:'+id);
  
  if (!root.hasOwnProperty(type))
    cont.error(404, 'Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1)
      cont.success(models[0]);
    else if (models.length<1)
      cont.error(404, 'Unknown id: '+id+' for type '+type);
    else
      cont.error(500, 'Multiple ids: '+id+' for type '+type);
  }
}

// todo: what if object already has an id?
function createModel(type, newModel, cont) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(newModel));
  
  if (!root.hasOwnProperty(type))
    root[type] = {idCounter: 0, models: []};
  
  var id = type+'-'+root[type].idCounter++;
  console.log('fresh id:'+id);
  newModel.id = id;
  root[type].models.push(newModel);
  //console.log('root: '+JSON.stringify(root));
  if (cont.success) {
    dbChanged();
    cont.success({id: id});
  }
}

function updateModel(type, id, newModel, cont) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(newModel));

  if (!root.hasOwnProperty(type))
    cont.error(404, 'Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models[ix] = newModel;
      if (cont.success) {
        dbChanged();
        cont.success({});
      }
    }
    else if (models.length<1)
      cont.error(404, 'Unknown id: '+id+' for type '+type);
    else
      cont.error(500, 'Multiple ids: '+id+' for type '+type);
  }
}
function deleteModel(type, id, cont) {
  console.log('\nDELETE: type:'+type+' id:'+id);

  if (!root.hasOwnProperty(type))
    cont.error(404, 'Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models.splice(ix,1);
      if (cont.success) {
        dbChanged();
        cont.success();
      }
    }
    else if (models.length<1)
      cont.error(404, 'Unknown id: '+id+' for type '+type);
    else
      cont.error(500, 'Multiple ids: '+id+' for type '+type);
  }
}

function getAllModels(type, cont) {
  if (!root.hasOwnProperty(type))
    cont.success([]);
  else 
    cont.success(root[type].models);
}

exports.dbInfo = dbInfo;
exports.initDb = initDb;
exports.onChange = onChange;
exports.resetDb = resetDb;
exports.getAllModels = getAllModels;
exports.createModel = createModel;
exports.readModel = readModel;
exports.updateModel = updateModel;
exports.deleteModel = deleteModel;
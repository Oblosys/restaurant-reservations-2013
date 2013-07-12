var util =     require('./shared/util.js');

/* Basic CRUD server that stores models in root.<modelname>.models and keeps track of id counter */
var root = 
  { //reservation: { idCounter: 10, models: [{id: "reservation-1", name: "Pino", date: "4-6-2013"},{id: "reservation-2", name: "Tommie", date: "5-6-2013"}]}
  //, book:        { idCounter:100, models: [{id: "book-1", title: "Oblomov"},{id: "book-2", title: "War and peace"}]}            
  };

// todo: maybe create html errors? (need to pass res)

function readModel(type, id) {
  console.log('\nREAD: type:'+type+' id:'+id);
  
  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1)
      return models[0];
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
}

// todo: what if object already has an id?
function createModel(type, newModel) {
  console.log('\nCREATE: type:'+type);
  console.log('content: '+JSON.stringify(newModel));
  
  if (!root.hasOwnProperty(type))
    root[type] = {idCounter: 0, models: []};
  
  var id = type+'-'+root[type].idCounter++;
  console.log('fresh id:'+id);
  newModel.id = id;
  root[type].models.push(newModel);
  //console.log('root: '+JSON.stringify(root));
  return {id: id};
}

function updateModel(type, id, newModel) {
  console.log('\nUPDATE: type:'+type+' id:'+id);
  console.log('content: '+JSON.stringify(newModel));

  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models[ix] = newModel;
    }
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
  //console.log('root: '+JSON.stringify(root));
  return {};
}
function deleteModel(type, id) {
  console.log('\nDELETE: type:'+type+' id:'+id);

  if (!root.hasOwnProperty(type))
    console.error('Unknown type: '+type);
  else {
    var models = _.where(root[type].models, {id: id});
    if (models.length==1) {
      var ix = root[type].models.indexOf(models[0]);
      root[type].models.splice(ix,1);
    }
    else if (models.length<1)
      console.error('Unknown id: '+id+' for type '+type);
    else
      console.error('Multiple ids: '+id+' for type '+type);
  }
  //console.log('root: '+JSON.stringify(root));
  return {};
}

exports.resetDb = resetDb;
exports.getAllModels = getAllModels;
exports.createModel = createModel;
exports.readModel = readModel;
exports.updateModel = updateModel;
exports.deleteModel = deleteModel;
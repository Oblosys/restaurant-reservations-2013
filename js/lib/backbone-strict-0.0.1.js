// backbone-strict.js 0.0.1
// http://underscorejs.org
// (c) 2013 Martijn Schrage - Oblomov Systems
// Backbone-strict may be freely distributed under the MIT license.

/*

TODO: what do we do when keys are deleted?
TODO: how to throw errors? console.error is much nicer in JavaScript, but backbone uses throw new Error

What to do with has? Seems to make no sense to implement checking for has, but has also returns false if attr exists but is null
so defaults: {a: null}   -> has('a') == false
but maybe    {a: null}   -> has('aa') should yield an error since aa is undeclared?
*/

var original = { 
  on: Backbone.on,
  Model: Backbone.Model,
  get: Backbone.Model.prototype.get, // this is Model.get, so is a flat original a good idea? or do we need a nested structure?
  set: Backbone.Model.prototype.set
};


Backbone.Model = function(attributes, options) {
  var attrs = attributes || {};
  options || (options = {});
  this.cid = _.uniqueId('c');
  this.attributes = {};
  if (options.collection) this.collection = options.collection;
  if (options.parse) attrs = this.parse(attrs, options) || {};
  attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
  this._declared = Object.keys(attrs);
  this.set(attrs, options);
  this.changed = {};
  this.initialize.apply(this, arguments);
};
Backbone.Model.prototype = original.Model.prototype;
_.extend(Backbone.Model, original.Model); // extend does not copy the prototype


Backbone.Model.prototype.on = function(name, callback, context) {
      if (name.indexOf("change:")!=-1) {
        var key = name.substring(7);
        //console.log('Change event on key '+name.substring(7));
        if (this._declared) // todo: what do we do if it's not declared? + add this to other _declared checks?
          if (!_(this._declared).contains(key))
//          throw new Error('on: Undeclared attribute \''+key+'\'.');
            console.error('on: Undeclared attribute \''+key+'\'.');

        //console.log(this._declared);
      }
      return original.on.apply(this,arguments);
};  
      


Backbone.Model.prototype.get = function (attr) {
  //console.log('strict get');
  if (!_(this._declared).contains(attr))
    console.error('get: Undeclared attribute \''+attr+'\'.');
  
  return original.get.apply(this,arguments);
};

Backbone.Model.prototype.set = function(key, val, options) {
  var attr, attrs, unset, changes, silent, changing, prev, current;
  if (key == null) return this;

  // Handle both `"key", value` and `{key: value}` -style arguments.
  if (typeof key === 'object') {
    attrs = key;
    options = val;
  } else {
    (attrs = {})[key] = val;
  }
  
  // TODO: what do we do when keys are deleted?
  // TODO: how to throw errors? console.error is much nicer in JavaScript, but backbone uses throw new Error
  //console.log('Setting keys '+Object.keys(attrs));
  var undeclaredKeys = _.difference(Object.keys(attrs), this._declared);
  if (undeclaredKeys.length > 0)
//    throw new Error('set: Undeclared attributes \''+undeclaredKeys+'\'.');
    console.error('set: Undeclared attributes \''+undeclaredKeys+'\'.');
  //original.set(attrs, options); // call original set with object-style arguments.
  return original.set.apply(this, [attrs,options]);

};

//Tests

//var runTests = true;
var runTests = false;

if (runTests) {
  var Mdl = Backbone.Model.extend({defaults: {attr: 'attr value'}});
  var mdl = new Mdl();
  mdl.set('attr','bla');
  mdl.set('undeclared-attr','bla');
  
  console.log('attr is '+ mdl.get('attr'));
  console.log(mdl.get('undeclared-attr'));
}
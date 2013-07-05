(function(exports){
  if (typeof require == 'undefined') require = function() {};
  // todo: how to do imports in imported modules? On client require is not defined 
  var _ = require('underscore');

  var debug = false;
  
  function log(msg) {
    if (debug)
      console.log(msg);
  }

  // NOTE: replicated objects are only cloned on top-level
  function replicate(n,x) {
    var xs = [];
    for (var i=0; i<n; i++) 
      xs.push(_.clone(x));
    return xs;
  }

  // depth is to prevent hanging on circular objects
  function showJSON(json,indent,depth) {
    indent = indent || '';
    depth = depth || 0;
    var str = '';
    
    if (depth>=10) // max depth
      str += typeof json != 'object' ? json : Array.isArray(json) ? '[...]' : '{...}';
    else {   
      if (Array.isArray(json)) {
        if (json.length ==0 )
          str += '[]';
        else {
          for (var i = 0; i<json.length; i++)
            str += (i==0?'[ ':indent + ', ') + showJSON(json[i],'  '+indent, depth+1)+'\n';
          str += indent + ']';
        }
      } 
      else {
        if (typeof json == 'object') {
          var keys = Object.keys(json); // TODO: use underscore version for safety
          if (keys.length ==0 )
            str += '{}';
          else {
            for (var i = 0; i<keys.length; i++)
              str += (i==0?'{ ':indent + ', ') + keys[i] + ':' +
              (typeof json[keys[i]] == 'object' ? '\n' + indent +'  ' : ' ') + // for object children start new line
              showJSON(json[keys[i]],'  '+indent, depth+1)+'\n';
            str += indent + '}';
          }
        }
        else
          str += json;
      }
    }
    return str;
  }
  
  function showDate(date) {
    return date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
  }

  function readDate(dateStr) {
    var parts = dateStr.split('-');
    if (parts.length == 3)
      return new Date(parts[2], parts[1]-1, parts[0]);
    else
      throw 'Exception: Incorrect date: "'+dateStr+'"';
  }

  exports.log = log;
  exports.replicate = replicate;
  exports.showJSON = showJSON;
  exports.showDate = showDate;
  exports.readDate = readDate;

})(typeof exports == 'undefined'? this.util={}: exports);
// Module for loading by Node.js as well as browser.
// Closure is to prevent declaring globals in browser.
// in Browser, exports is bound to global util variable.

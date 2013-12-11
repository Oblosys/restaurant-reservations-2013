(function(util){
  if (typeof window == 'undefined') {
    var _ = require('underscore');
  } else {  // NOTE: take care that corresponding modules are included in the embedding html page
    var _ = window._;
  };

  util.debug = true; // set to false on deployment
  
  util.log = function(msg) {
    if (util.debug && typeof console != 'undefined')
      console.log(msg);
  };

  // NOTE: replicated objects are only cloned on top-level
  util.replicate = function(n,x) {
    var xs = [];
    for (var i=0; i<n; i++) 
      xs.push(_.clone(x));
    return xs;
  };

  // pad integer with leading 0's when necessary 
  util.padZero = function(l, n) {
    return ('0000000000000000000000'+n).slice(-l);
  };

  // depth is to prevent hanging on circular objects
  util.showJSON = function(json,indent,depth) {
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
            str += (i==0?'[ ':indent + ', ') + util.showJSON(json[i],'  '+indent, depth+1)+'\n';
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
              util.showJSON(json[keys[i]],'  '+indent, depth+1)+'\n';
            str += indent + '}';
          }
        }
        else
          str += json;
      }
    }
    return str;
  };
  
  util.showTime = function(date) {
    return util.padZero(2, date.getHours()) + ':' + util.padZero(2, date.getMinutes()) + ':' + util.padZero(2, date.getSeconds());
  };

  util.showDate = function(date) {
    return util.padZero(2, date.getDate()) + '-' + util.padZero(2, date.getMonth()+1) + '-' + util.padZero(4, date.getFullYear());
  };

  util.readDate = function(dateStr) {
    var parts = dateStr.split('-');
    if (parts.length == 3)
      return new Date(parts[2], parts[1]-1, parts[0]);
    else
      throw 'Exception: Incorrect date: "'+dateStr+'"';
  };

  /* Set boolean DOM attribute for jQuery object $elt according to HTML standard.
   * (absence denotes false, attrName=AttrName denotes true) */
  util.setAttr = function($elt, attrName, isSet) {
    if (isSet) 
      $elt.attr(attrName, attrName);
    else
      $elt.removeAttr(attrName);  
  };

})(typeof exports == 'undefined' ? this.util={} : exports);
// Module for loading by Node.js as well as browser.
// Closure is to prevent declaring globals in browser.
// in Browser, exports is bound to global util variable.

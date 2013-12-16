//     oblo-util.js 0.1.0

//     (c) 2013-2011 Martijn M. Schrage, Oblomomov Systems
//     Oblo-util may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/oblosys/oblo-util

(function(util){ // Cannot have '-' in name, so use 'util' rather than the verbose 'oblo_util'
  
  
  // Notes: basic modules, no active importing, mainly experiment for using npm also on client
  // needs to be defined before we call it.
  // NOTE: on client, use last elt of path for oject ref, goes wrong with -'s in name.., so need to specify it in that case
  if (typeof window != 'undefined') // on client, NOTE: we have to manually include the required module scripts in the HTML
    window.require = function(moduleName, clientModuleObject) {
      return window[clientModuleObject ? clientModuleObject : moduleName.split('/').pop()];
    };
    

  var _ = require('underscore', '_'); // underscore calls itself '_' on client

  util.debug = true; // set this to false on deployment
  
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

})(typeof exports == 'undefined' ? this.util={} : exports); // pass exports if we're on the server, otherwise, create oblo-util

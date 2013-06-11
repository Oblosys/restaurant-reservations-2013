(function(exports){

  function showJSON(json,indent) {
    indent = indent || '';
    var str = '';
    if (Array.isArray(json)) {
      if (json.length ==0 )
        str += '[]';
      else {
        for (var i = 0; i<json.length; i++)
          str += (i==0?'[ ':indent + ', ') + showJSON(json[i],'  '+indent)+'\n';
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
            showJSON(json[keys[i]],'  '+indent)+'\n';
          str += indent + '}';
        }
      }
      else
        str += json;
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

  exports.showJSON = showJSON;
  exports.showDate = showDate;
  exports.readDate = readDate;

})(typeof exports == 'undefined'? this['util']={}: exports);
// Module for loading by Node.js as well as browser.
// Closure is to prevent declaring globals in browser.
// in Browser, exports is bound to global util variable.

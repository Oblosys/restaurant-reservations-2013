/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200;

var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

var mimeTypes = { "html": "text/html"
				, "jpeg": "image/jpeg"
				,"jpg": "image/jpeg"
				, "png": "image/png"
				, "js": "text/javascript"
				, "css": "text/css"
                };
function writeError(res, nr, msg){
  res.writeHead(nr, {'Content-Type': 'text/plain'});
  res.write(msg);
  res.end();
}

function handler(req, res) {
  var uri = url.parse(req.url).pathname;
  uri = uri == '/' ? 'index.html' : uri;
  var filename = path.join(process.cwd(), path.join('www', unescape(uri)));
  console.log(uri+ ' '+ filename);

  try {
    stats = fs.lstatSync(filename); // throws if path doesn't exist
  } catch (e) {
    writeError(res,404,'File not Found\n');
    return;
  }

  if (stats.isFile()) {
    // path exists, is a file
    var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
    res.writeHead(200, {'Content-Type': mimeType} );

    //try {
      var fileStream = fs.createReadStream(filename);
      fileStream.on('error', function() { 
        writeError(res,404,'Cannot open file\n');
      });
      
      console.log('before');
      fileStream.pipe(res);
      console.log('after'); // todo: even on exception in pipe, this code executes
    //} catch (e) {
    //  console.log('error reading file: '+e);
    //};
      
  //} else if (stats.isDirectory()) {
  // directory
  } else {
    // Symbolic link, other?
    // TODO: follow symlinks?  security?
    writeError(res, 404,'Incorrect type\n');
  } 
}

process.on('uncaughtException', function(err) {
  // handle the error safely
  console.log(err);
});


http.createServer(handler).listen(portNr);

console.log('Server running at http://127.0.0.1:'+portNr+'/');
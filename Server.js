/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200
  , http = require('http')
  , url = require('url')
  , fs = require('fs')
  , connect = require('connect')
  , app;

function writeError(res, nr, msg){
  res.writeHead(nr, {'Content-Type': 'text/plain'});
  res.write(msg);
  res.end();
}

function modelHandler(req, res) {
  var uri = url.parse(req.url).pathname;
  console.log('model Handler: '+req.method+' '+uri);
  
  if (req.method == 'GET')
    res.end('{"x":10,"y":20,"z":30}');
  else if (req.method == 'POST')
    postHandler(req,res);
  else
    writeError(res,400,'Unhandled method: \''+req.method+'\'');
}

function postHandler(req, res) {
  var postData = '';
  req.on('data', function (data) {
      postData += data;
  });
  req.on('end', function () {
      console.log(postData);
  });
}

// todo: still necessary?
process.on('uncaughtException', function(err) {
  // handle the error safely
  console.log(err);
});


app = connect()
  //.use(connect.favicon())
  .use(connect.logger('dev'))
  .use(connect.static('www'))
  .use('/model',modelHandler);

http.createServer(app).listen(portNr, function() {
  console.log('Server running at http://127.0.0.1:'+portNr+'/');
});

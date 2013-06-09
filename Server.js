/**
 * Web server for reservations app
 */

var portNr = process.argv[2] || 8200
  , modelFileName = 'model/reservations.json'
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
  console.log('Model handler: '+req.method+' (/model)'+uri);
  
  if (req.method == 'GET') { // simply send contents of reservation.json
    var fileStream = fs.createReadStream(modelFileName);
    fileStream.on('error', function() { 
      //writeError(res,404,'Cannot open file\n');
    });
    fileStream.pipe(res);
  } 
  else if (req.method == 'POST')
    postHandler(req,res);
  else
    putHandler(req,res);
//    writeError(res,400,'Unhandled method: \''+req.method+'\'');
}

var globalCounter = 0;
function postHandler(req, res) { // simply write post data to reservation.json
  var postData = '';
  req.on('data', function (data) {
      postData += data;
  });
  req.on('end', function () {
      console.log('Received '+postData);
      fs.writeFile(modelFileName, postData, function (data) {
        // what do we do here?
        var freshId = 'res-'+ globalCounter++;
        console.log('created id: '+freshId);
        res.writeHead(200, {'Content-Type': 'application/json'});
        // TODO: header does not get set, probably causes the firefox "not well-formed" complaint
        res.write('{"id": "'+freshId+'"}');
        res.end();
      });
  });
}

function putHandler(req, res) { // simply write post data to reservation.json
  var postData = '';
  req.on('data', function (data) {
      postData += data;
  });
  req.on('end', function () {
      console.log('Received '+postData);
      fs.writeFile(modelFileName, postData, function (data) {
        // what do we do here?
        var freshId = 'res-'+ globalCounter++;
        res.writeHead(200, {'Content-Type': 'application/json'});
        // TODO: header does not get set, probably causes the firefox "not well-formed" complaint
        // no response means id stays the same
        res.end();
      });
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

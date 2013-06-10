/**
 * Web server for reservations app
 */

var genericServer = require('./genericServer.js');

var app = genericServer();

app.get('/query/:q', function(req, res) {
  console.log(JSON.stringify(genericServer.root));
  res.send('ja');
});
genericServer.createServer(app);

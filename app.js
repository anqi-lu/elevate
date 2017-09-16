'use strict';

const 
  bodyParser = require('body-parser'),
  crypto = require('crypto'),
  express = require('express'),
  request = require('request');

var app = express();
app.set('port', process.env.PORT);
app.use(bodyParser.json());

app.use('fb_messenger', require('./lib/fb_messenger'));
app.use('api', require('./lib/api'));

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});
module.exports = app;
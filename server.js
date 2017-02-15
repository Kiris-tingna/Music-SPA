'use strict';
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var Api = require('./api');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(__dirname + '/bower_components'));//bower静态化
app.get('/', routes.index);
// app.get('/users', user.list);

Api(app);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

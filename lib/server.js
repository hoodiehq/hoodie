/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var connect = require('connect');
var http = require('http');

var loggers = require('./middleware/loggers');
var serve_file = require('./middleware/serve_file');
var serve_hoodie = require('./middleware/serve_hoodie');
var plugin_api = require('./middleware/plugin_api');
var cors = require('./middleware/cors');
var api = require('./middleware/api');
var hconsole = require('./hconsole');

/**
 * Creates a new http server start function
 */

module.exports = function (server_config) {

  return function (config, callback) {

    // Defines a new ConnectJS app
    var app = connect(
      loggers.dev(server_config.name),
      cors(),
      serve_hoodie(config),
      plugin_api(config),
      api(config),
      connect.compress(),
      connect.static(server_config.root),
      serve_file(config.default_file())
    );

    var server = http.createServer(app);
    // store in config.name_server property so the nodejitsu_server
    // can access it later if required
    config[server_config.name + '_server'] = server;

    if (server_config.listen) {
      var host = server_config.host;
      var port = server_config.port;

      // start listening then call callback
      return server.listen(port, host, hconsole.announce(
        server_config.message,
        callback
      ));
    } else {
      // don't start listening
      return callback();
    }

  };

};

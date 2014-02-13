/**
 * Creates a proxy server to handle nodejitsu requests based on subdomain
 */

var http = require('http');
var httpProxy = require('http-proxy');

module.exports = function (config, callback) {

  // skip this server if not on nodejitsu
  if (!config.run_nodejitsu_server) {
    return callback();
  }

  var proxy = httpProxy.createProxyServer({});

  return http.createServer(function (req, res) {
    var host = req.headers.host;
    var subdomain = host.split('.')[0];
    var options = { target: 'http://' + config.host + ':' };

    switch (subdomain) {
    case 'admin':
      options.target += config.admin_port;
      break;
    case 'couch':
      options.target = config.couch.url;
      break;
    default:
      options.target += config.www_port;
      break;
    }

    proxy.web(req, res, options);

  }).listen(80, config.host, callback);

};


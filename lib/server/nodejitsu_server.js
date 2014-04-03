/**
 * Creates a proxy server to handle nodejitsu requests based on subdomain
 */

var Hapi = require('hapi');

module.exports = function (config, callback) {

  // skip this server if not on nodejitsu
  if (!config.run_nodejitsu_server) {
    return callback();
  }

  var server = new Hapi.Server(8080, {
    cors: true,
    labels: [ 'nodejitsu' ]
  });

  function mapProxyPath(req, cb) {
    var host = req.headers.host;
    var subdomain = host.split('.')[0];
    var target = 'http://' + config.host + ':';

    if (subdomain === 'admin') {
      target += config.admin_port;
    } else if (subdomain === 'couch') {
      target = config.couch.url;
    } else {
      target += config.www_port;
    }

    cb(null, target + req.url.path);
  }

  server.route({
    path: '/{p*}',
    method: '*',
    handler: {
      proxy: {
        passThrough: true,
        mapUri: mapProxyPath
      }
    }
  });

  server.start(callback);

};


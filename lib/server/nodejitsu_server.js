var httpProxy = require('http-proxy');

/**
 * Creates a proxy server to handle nodejitsu requests based on subdomain
 */

module.exports = function (config, callback) {

  return function (config, callback) {

    // skip this server if not on nodejitsu
    if (!config.run_nodejitsu_server) {
      return callback();
    }

    var options = {
      router : {
        '^admin.': config.host + ':' + config.admin_port,
        '.': config.host + ':' + config.www_port
      }
    };

    return httpProxy.createServer(options).listen(8080, config.host, callback);

  };

};

/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var Hapi = require('hapi');

module.exports = function () {

  return function (env_config, callback) {

    var server = new Hapi.Server({
      connections: {
        routes: {
          cors: {
            override: false
          },
          payload: {
            maxBytes: 1048576 * 10 // 10 MB
          }
        }
      }
    });

    env_config.hooks.runStatic('server.pack.pre', [server]);

    server.connection({
      port: env_config.www_port,
      labels: ['web']
    });

    server.connection({
      port: env_config.admin_port,
      labels: ['admin']
    });

    var hapi_plugins = [
      './plugins/web',
      './plugins/admin',
      './plugins/api',
      './helpers/logger',
      './helpers/handle_404'
    ];

    // register plugins against the server pack
    //
    hapi_plugins.forEach(function (plugin) {
      server.register({
        register: require(plugin),
        options: {
          app: env_config
        }
      }, function (err) {
        if (err) {
          console.error('Failed to load a plugin:', err);
        }
      });
    });

    env_config.hooks.runStatic('server.pack.post', [server]);

    server.start(function () {
      console.log('WWW:   ', env_config.www_link());
      console.log('Admin: ', env_config.admin_link());

      return callback();
    });

  };

};


/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var Hapi = require('hapi');

module.exports = function () {

  return function (env_config, callback) {

    var pack = new Hapi.Pack();

    env_config.hooks.runStatic('server.pack.pre', [pack]);

    pack.server(env_config.www_port, {
      labels: ['web'],
      cors: true,
      payload: {
        maxBytes: 1048576 * 10 // 10 MB
      }
    });

    pack.server(env_config.admin_port, {
      labels: ['admin'],
      cors: true,
      payload: {
        maxBytes: 1048576 * 10 // 10 MB
      }
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
      pack.register([
        {
          plugin: require(plugin),
          options: {
            app: env_config,
            web: pack._servers[0],
            admin: pack._servers[1]
          }
        }
      ], function (err) {
        if (err) {
          console.error('Failed to load a plugin:', err);
        }
      });
    });

    env_config.hooks.runStatic('server.pack.post', [pack]);

    pack.start(function () {
      console.log('WWW:   ', env_config.www_link());
      console.log('Admin: ', env_config.admin_link());

      return callback();
    });

  };

};


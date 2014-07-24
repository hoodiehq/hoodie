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
      cors: true
    });

    pack.server(env_config.admin_port, {
      labels: ['admin'],
      cors: true
    });

    // register plugins against the server pack
    //
    pack.require('./plugins/web', {
      app: env_config,
      www_root: env_config.www_root
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
      console.log('WWW:   ', env_config.www_link());
    });

    pack.require('./plugins/admin', {
      app: env_config,
      admin_root: env_config.admin_root
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
      console.log('Admin: ', env_config.admin_link());
    });

    pack.require('./plugins/api', {
      app: env_config
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
    });

    // register custom hapi helpers
    //
    var helpers = [
      './helpers/logger',
      './helpers/handle_404'
    ];

    helpers.forEach(function (helper) {
      pack.require(helper, {
        app: env_config,
        web: pack._servers[0],
        admin: pack._servers[1]
      }, function (err) {
        if (err) {
          console.log('err', err);
        }
      });
    });

    env_config.hooks.runStatic('server.pack.post', [pack]);

    pack.start(function () {
      return callback();
    });

  };

};


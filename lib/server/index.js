/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var Hapi = require('hapi');

module.exports = function (server_config) {

  return function (config, callback) {

    var pack = new Hapi.Pack();

    config.hooks.runStatic('server.pack.pre', [pack]);

    pack.server(server_config.www_port, {
      labels: ['web'],
      cors: true
    });

    pack.server(server_config.admin_port, {
      labels: ['admin'],
      cors: true
    });

    // register plugins against the server pack
    //
    pack.require('./plugins/web', {
      app: config,
      www_root: server_config.www_root
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
      console.log('WWW:   ', server_config.www_link());
    });

    pack.require('./plugins/admin', {
      app: config,
      admin_root: server_config.admin_root
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
      console.log('Admin: ', server_config.admin_link());
    });

    pack.require('./plugins/api', {
      app: config
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
        app: config,
        web: pack._servers[0],
        admin: pack._servers[1]
      }, function (err) {
        if (err) {
          console.log('err', err);
        }
      });
    });

    config.hooks.runStatic('server.pack.post', [pack]);

    pack.start(function () {
      return callback();
    });

  };

};


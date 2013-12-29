var couchr = require('couchr'),
    async = require('async'),
    environment = require('../lib/core/environment'),
    config = require('../lib/core/config'),
    app = require('../lib/index'),
    path = require('path'),
    url = require('url'),
    utils = require('./lib/utils');


exports['check config dbs are private to admin'] = function (test) {
  var project_dir = path.resolve(__dirname, 'fixtures/project1');

  var cfg = environment.getConfig(
    process.platform,   // platform
    process.env,        // environment vars
    project_dir,        // project directory
    []                  // command-line arguments
  );

  cfg.admin_password = 'testing';

  utils.resetFixture(project_dir, function (err) {
    if (err) {
      return test.done(err);
    }
    app.init(cfg, function (err) {
      if (err) {
        return test.done(err);
      }
      async.parallel([
        function (cb) {
          var appdb = url.resolve(cfg.couch.url, '/app');
          couchr.get(appdb, function (err, data, res) {
            test.equal(res.statusCode, 401);
            cb();
          });
        },
        function (cb) {
          var plugindb = url.resolve(cfg.couch.url, '/plugins');
          couchr.get(plugindb, function (err, data, res) {
            test.equal(res.statusCode, 401);
            cb();
          });
        },
        function (cb) {
          var appdb = url.resolve(cfg.couch.url, '/app');
          config.getCouchCredentials(cfg, function (err, username, password) {
            var parsed = url.parse(appdb);
            parsed.auth = username + ':' + password;
            appdb = url.format(parsed);
            couchr.get(appdb, function (err, data, res) {
              test.equal(res.statusCode, 200);
              cb();
            });
          });
        },
        function (cb) {
          var plugindb = url.resolve(cfg.couch.url, '/plugins');
          config.getCouchCredentials(cfg, function (err, username, password) {
            if (err) {
              return test.done(err);
            }
            var parsed = url.parse(plugindb);
            parsed.auth = username + ':' + password;
            plugindb = url.format(parsed);
            couchr.get(plugindb, function (err, data, res) {
              test.equal(res.statusCode, 200);
              cb();
            });
          });
        }
      ],
      function (err) {
        if (err) {
          return test.done(err);
        }
        test.done();
      });
    });
  });
};

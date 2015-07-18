var expect = require('expect.js');
var hoodie_server = require('../../');
var http = require('http');
var os = require('os');

var config = require('../support/test-config');

describe('block _all_dbs', function () {
  this.timeout(30000);

  it('should 404 on /_api/_all_dbs', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/_api/_all_dbs',
      agent: false
    }, function (res) {
      expect(res.statusCode).to.be(404);
      done();
    });
  });


  it('should log into admin', function (done) {
    var body = 'name=admin&password=' + config.admin_password;
    var req = http.request({
      host: '127.0.0.1',
      port: config.admin_port,
      method: 'post',
      path: '/_api/_session',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-length': body.length
      },
      agent: false
    }, function (res) {
      expect(res.statusCode).to.be(200);
      done();
    });
    req.write(body);
    req.end();
  });

});

/* tests ported over from nodeunit, hence the sligtly different style */
var couchr = require('couchr');
var async = require('async');
var environment = require('../../lib/core/environment');
var configStore = require('../../lib/core/config_store');
var app = require('../../lib/index');
var path = require('path');
var url = require('url');
var utils = require('../lib/utils');

describe('check config dbs are private to admin', function() {

  it('should make sure config dbs are private', function(done) {
    var project_dir = path.resolve(__dirname, '../fixtures/project1');

    var cfg = environment.getConfig(
      process.platform,   // platform
      process.env,        // environment vars
      project_dir,        // project directory
      []                  // command-line arguments
    );

    cfg.admin_password = 'testing';

    utils.resetFixture(project_dir, function (err) {
      if (err) {
        return done(err);
      }
      app.init(cfg, function (err) {
        if (err) {
          return done(err);
        }
        async.parallel([
          function (cb) {
            var appdb = url.resolve(cfg.couch.url, '/app');
            couchr.get(appdb, function (err, data, res) {
              expect(res.statusCode).to.be(401);
              cb();
            });
          },
          function (cb) {
            var plugindb = url.resolve(cfg.couch.url, '/plugins');
            couchr.get(plugindb, function (err, data, res) {
              expect(res.statusCode).to.be(401);
              cb();
            });
          },
          function (cb) {
            var appdb = url.resolve(cfg.couch.url, '/app');
            configStore.getCouchCredentials(cfg, function (err, username, password) {
              var parsed = url.parse(appdb);
              parsed.auth = username + ':' + password;
              appdb = url.format(parsed);
              couchr.get(appdb, function (err, data, res) {
                expect(res.statusCode).to.be(200);
                cb();
              });
            });
          },
          function (cb) {
            var plugindb = url.resolve(cfg.couch.url, '/plugins');
            configStore.getCouchCredentials(cfg, function (err, username, password) {
              if (err) {
                return done(err);
              }
              var parsed = url.parse(plugindb);
              parsed.auth = username + ':' + password;
              plugindb = url.format(parsed);
              couchr.get(plugindb, function (err, data, res) {
                expect(res.statusCode).to.be(200);
                cb();
              });
            });
          }
        ],
        function (err) {
          if (err) {
            return done(err);
          }
          done();
        });
      });
    });

  });
});

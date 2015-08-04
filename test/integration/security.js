var path = require('path')
var url = require('url')

var async = require('async')
var request = require('request')
var test = require('tap').test

var app = require('../../lib/index')
var configStore = require('../../lib/core/config_store')
var environment = require('../../lib/core/environment')
var utils = require('../lib/utils')

var startServerTest = require('../lib/start-server-test')
var config = require('../lib/config')

startServerTest(test, 'block _all_dbs', config, function (t, end) {
  t.test('should 404 on /_api/_all_dbs', function (tt) {
    request.get(config.url + '/_api/_all_dbs', function (error, res) {
      tt.error(error)
      tt.is(res.statusCode, 404)
      tt.end()
    })
  })
  t.test('should log into admin', function (tt) {
    request.post(config.url + '/_api/_session', {
      form: {
        name: 'admin',
        password: config.admin_password
      }
    }, function (error, res, data) {
      tt.error(error)
      tt.is(res.statusCode, 200)
      tt.end()
    })
  })
  t.test('check config dbs are private to admin', function (tt) {
    var projectDir = path.resolve(__dirname, '../lib/fixtures/project1')
    var cfg = environment.getConfig(
      process.platform, // platform
      process.env,     // environment vars
      projectDir,     // project directory
      []             // command-line arguments
    )
    cfg.admin_password = 'testing'
    console.log(cfg.couch.url)

    utils.resetFixture(projectDir, function (error) {
      if (error) throw error
      app.init(cfg, function (error) {
        if (error) throw error
        async.parallel([
          function (cb) {
            request.get(cfg.couch.url + '/app', function (error, res) {
              tt.error(error)
              tt.is(res.statusCode, 401)
              cb()
            })
          },
          function (cb) {
            request.get(cfg.couch.url + '/plugins', function (error, res) {
              tt.error(error)
              tt.is(res.statusCode, 401)
              cb()
            })
          },
          function (cb) {
            var appdb = cfg.couch.url + '/app'
            configStore.getCouchCredentials(cfg, function (er, username, password) {
              var parsed = url.parse(appdb)
              parsed.auth = username + ':' + password
              appdb = url.format(parsed)
              request.get(appdb, function (error, res) {
                tt.error(error)
                tt.is(res.statusCode, 200)
                cb()
              })
            })
          },
          function (cb) {
            var plugindb = cfg.couch.url + '/plugins'
            configStore.getCouchCredentials(cfg, function (error, username, password) {
              if (error) throw error
              var parsed = url.parse(plugindb)
              parsed.auth = username + ':' + password
              plugindb = url.format(parsed)
              request.get(plugindb, function (error, res) {
                tt.error(error)
                tt.is(res.statusCode, 200)
                cb()
              })
            })
          }
        ], function (error) {
          tt.error(error)
          utils.killCouch(path.join(projectDir, 'data'), tt.end)
        })
      })
    })
  })
  t.test('teardown', end)
})

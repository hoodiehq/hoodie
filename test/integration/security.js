var path = require('path')
var url = require('url')

var async = require('async')
var request = require('request')
var rimraf = require('rimraf')
var tap = require('tap')
var test = tap.test

var app = require('../../lib/index')
var credentials = require('../../lib/couchdb/credentials')
var config = require('../../lib/core/config')

var startServerTest = require('../lib/start-server-test')

startServerTest(test, 'block _all_dbs', function (t, env_config, end) {
  t.test('should 404 on /_api/_all_dbs', function (tt) {
    request.get(env_config.www_link + '/_api/_all_dbs', function (error, res) {
      tt.error(error)
      tt.is(res.statusCode, 404)
      tt.end()
    })
  })

  t.test('should log into admin', function (tt) {
    request.post(env_config.www_link + '/_api/_session', {
      form: {
        name: 'admin',
        password: env_config.admin_password
      }
    }, function (error, res, data) {
      tt.error(error)
      tt.is(res.statusCode, 200)
      tt.end()
    })
  })

  t.test('check config dbs are private to admin', function (tt) {
    var projectDir = path.resolve(__dirname, '../lib/fixtures/project1')
    var cfg = config({
      cwd: projectDir
    })

    cfg.admin_password = 'testing'
    async.series([
      rimraf.bind(null, cfg.hoodie.data_path),
      app.init.bind(null, cfg),
      function (server, cb) {
        server.start(cb)
      },
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
        var couchdb = credentials.get(cfg.hoodie.data_path)

        var parsed = url.parse(appdb)
        parsed.auth = couchdb.username + ':' + couchdb.password
        appdb = url.format(parsed)

        request.get(appdb, function (error, res) {
          tt.error(error)
          tt.is(res.statusCode, 200)
          cb()
        })
      },
      function (cb) {
        var plugindb = cfg.couch.url + '/plugins'
        var couchdb = credentials.get(cfg.hoodie.data_path)

        var parsed = url.parse(plugindb)
        parsed.auth = couchdb.username + ':' + couchdb.password
        plugindb = url.format(parsed)
        request.get(plugindb, function (error, res) {
          tt.error(error)
          tt.is(res.statusCode, 200)
          cb()
        })
      }
    ], function (error) {
      tt.error(error)
      tt.end()
    })
  })
  t.test('teardown', end)
})

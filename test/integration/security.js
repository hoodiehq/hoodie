var path = require('path')
var url = require('url')

var _ = require('lodash')
var async = require('async')
var request = require('request')
var rimraf = require('rimraf')
var tap = require('tap')
var test = tap.test

var app = require('../../lib')

var startServerTest = require('./lib/start-server-test')

startServerTest(test, 'block _all_dbs', function (t, env_config, end) {
  t.test('should 404 on /hoodie/_all_dbs', function (tt) {
    request.get(url.format(env_config.app) + '/hoodie/_all_dbs', function (error, res) {
      tt.error(error)
      tt.is(res.statusCode, 404)
      tt.end()
    })
  })

  t.test('should log into admin', function (tt) {
    request.post(url.format(env_config.app) + '/hoodie/_session', {
      form: {
        name: 'admin',
        password: env_config.admin.password
      }
    }, function (error, res, data) {
      tt.error(error)
      tt.is(res.statusCode, 200)
      tt.end()
    })
  })

  t.test('check config dbs are private to admin', function (tt) {
    var projectDir = path.resolve(__dirname, './lib/fixtures/project1')
    var options = {
      inMemory: true,
      id: 'hoodie-test-fixture',
      path: projectDir,
      adminPassword: 'testing'
    }

    async.waterfall([
      async.apply(rimraf, path.join(projectDir, 'data')),
      async.apply(app, options),
      function (server, env_config, cb) {
        server.start(cb)
      },
      function (cb) {
        request.get(url.format(_.omit(env_config.db, 'auth')) + '/app/_all_docs', function (error, res) {
          tt.error(error)
          tt.is(res.statusCode, 401)
          cb()
        })
      },
      function (cb) {
        request.get(url.format(env_config.db) + '/app/_all_docs', function (error, res) {
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

var url = require('url')

var request = require('request')
var tap = require('tap')
var test = tap.test

var startServerTest = require('./lib/start-server-test')

startServerTest(test, 'setting CORS headers', function (t, env_config, end) {
  t.test('should echo the origin back if one is given', function (tt) {
    request.get(url.format(env_config.app) + '/hoodie/_session/', {
      headers: {
        origin: 'http://some.app.com/',
        'transfer-encoding': 'chunked'
      }
    }, function (error, res) {
      if (error) throw error
      tt.is(res.headers['access-control-allow-origin'], 'http://some.app.com/')
      tt.is(res.statusCode, 200)
      tt.end()
    })
  })
  t.test('teardown', end)
})

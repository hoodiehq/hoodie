var request = require('request')
var tap = require('tap')
var test = tap.test

var startServerTest = require('./lib/start-server-test')

startServerTest(test, 'handle 404', function (t, env_config, end) {
  t.test('should send index.html on accept: text/html', function (tt) {
    request.get(env_config.www_link + '/does_not_exist', {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, function (error, res, data) {
      if (error) throw error
      tt.is(data, 'hi\n')
      tt.is(res.statusCode, 200)
      tt.end()
    })
  })
  t.test('should send a JSON 404 on anything but accept: text/html*', function (tt) {
    request.get(env_config.www_link + '/does_not_exist', {
      json: true
    }, function (error, res, data) {
      if (error) throw error
      tt.is(data.error, 'Not Found')
      tt.is(data.statusCode, 404)
      tt.is(res.statusCode, 404)
      tt.end()
    })
  })
  t.test('teardown', end)
})

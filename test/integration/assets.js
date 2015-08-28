var url = require('url')

var request = require('request')
var tap = require('tap')
var test = tap.test

var startServerTest = require('./lib/start-server-test')

startServerTest(test, 'should get asset path', function (t, env_config, end) {
  request.get(url.format(env_config.app) + '/_api/_plugins/_assets/index.html', function (error, res) {
    if (error) throw error
    t.is(res.statusCode, 200)
    end()
  })
})

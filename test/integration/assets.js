var request = require('request')
var test = require('tap').test

var startServerTest = require('../lib/start-server-test')

startServerTest(test, 'should get asset path', function (t, env_config, end) {
  request.get(env_config.www_link + '/_api/_plugins/_assets/index.html', function (error, res) {
    if (error) throw error
    t.is(res.statusCode, 200)
    end()
  })
})

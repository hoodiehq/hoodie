var request = require('request')
var test = require('tap').test

var startServerTest = require('../lib/start-server-test')
var config = require('../lib/config')

startServerTest(test, 'should get asset path', config, function (t, end) {
  request.get(config.url + '/_api/_plugins/_assets/index.html', function (error, res) {
    if (error) throw error
    t.is(res.statusCode, 200)
    end()
  })
})

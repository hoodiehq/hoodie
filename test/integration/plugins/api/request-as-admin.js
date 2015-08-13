var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('request as admin', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.request('GET', '/_users/_all_docs', {}, function (err, data, res) {
    if (err) t.fail()
    t.equal(res.statusCode, 200)
    t.end()
  })
})

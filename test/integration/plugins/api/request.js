var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('request', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.request('GET', '/', {}, function (err, data) {
    if (err) t.fail()
    t.equal(data['express-pouchdb'], 'Welcome!')
    t.end()
  })
})

var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('update config from couch', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  t.strictEqual(hoodie.config.get('asdf'), undefined)
  hoodie.config._updateAppConfig({asdf: 1234})
  t.equal(hoodie.config.get('asdf'), 1234)
  hoodie.config._updatePluginConfig({asdf: 5678})
  t.equal(hoodie.config.get('asdf'), 5678)
  t.end()
})

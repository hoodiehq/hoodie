var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('database.add with existing db', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database.add, 'foo')
  ], function (err) {
    if (err) t.fail()
    t.end()
  })
})

var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('database: get by name', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('wibble', function (err, db) {
    if (err) t.fail()
    var db2 = hoodie.database('wibble')
    t.equal(db._resolve('wobble'), db2._resolve('wobble'))
    t.end()
  })
})

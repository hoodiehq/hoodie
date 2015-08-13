var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.add: set createdAt', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var doc = {
    id: 'bar',
    title: 'wibble'
  }
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database('foo').add, 'mytype', doc),
    async.apply(hoodie.database('foo').find, 'mytype', 'bar')
  ],
  function (err, results) {
    if (err) t.fail()

    var doc = results[2]
    t.ok(doc.createdAt, 'createdAt property set')
    t.end()
  })
})

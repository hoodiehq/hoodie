var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('database: add / findAll / remove', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  async.series([
    async.apply(hoodie.database.add, 'foo'),
    async.apply(hoodie.database.add, 'bar'),
    hoodie.database.findAll,
    async.apply(hoodie.database.remove, 'foo'),
    hoodie.database.findAll,
    async.apply(hoodie.database.remove, 'bar'),
    hoodie.database.findAll
  ], function (err, results) {
    if (err) t.fail()
    var a = results[2][0].sort()
    var b = results[4][0].sort()
    var c = results[6][0].sort()

    t.same(a, ['app', 'bar', 'foo', 'plugins'])
    t.same(b, ['app', 'bar', 'plugins'])
    t.same(c, ['app', 'plugins'])
    t.end()
  })
})

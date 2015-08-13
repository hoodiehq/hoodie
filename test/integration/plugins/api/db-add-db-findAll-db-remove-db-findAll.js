var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('db.add / db.findAll / db.remove / db.findAll', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()
    async.series([
      async.apply(db.add, 'mytype', {id: 'wibble', title: 'Test'}),
      db.findAll,
      async.apply(db.remove, 'mytype', 'wibble'),
      db.findAll
    ], function (err, results) {
      if (err) t.fail()
      t.equal(results[1].length, 1)
      t.equal(results[1][0].id, 'wibble')
      t.equal(results[3].length, 0)
      t.end()
    })
  })
})

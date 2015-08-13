var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.add / db.findAll / db.removeAll / db.findAll', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()
    async.series([
      async.apply(db.add, 'type1', {id: 'wibble'}),
      async.apply(db.add, 'type1', {id: 'wobble'}),
      async.apply(db.add, 'type2', {id: 'wubble'}),
      db.findAll,
      async.apply(db.removeAll, 'type1'),
      db.findAll
    ], function (err, results) {
      if (err) t.fail()
      t.equal(results[3].length, 3)
      t.equal(results[3][0].id, 'wibble')
      t.equal(results[3][1].id, 'wobble')
      t.equal(results[3][2].id, 'wubble')
      t.equal(results[5].length, 1)
      t.equal(results[5][0].id, 'wubble')
      t.end()
    })
  })
})

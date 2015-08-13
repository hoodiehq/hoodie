/* global emit, sum */ // couchdb globals

var _ = require('lodash')
var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.add / db.addIndex / db.query', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()

    var doc1 = {id: 'rich-tea', name: 'Rich tea'}
    var doc2 = {id: 'digestive', name: 'Digestive'}
    var doc3 = {id: 'chocolate-chip', name: 'Chocolate chip'}

    async.parallel([
      async.apply(db.add, 'biscuit', doc1),
      async.apply(db.add, 'biscuit', doc2),
      async.apply(db.add, 'cookie', doc3)
    ], function (err) {
      if (err) t.fail()

      var index = {
        map: function (doc) {
          emit(doc.type, 1)
        },
        reduce: function (key, values) {
          return sum(values)
        }
      }

      db.addIndex('by_type', index, function (err, data) {
        if (err) t.fail()
        t.ok(data.ok)
        t.equal(data.id, '_design/views')
        t.equal(typeof data.rev, 'string')

        db.query('by_type', { group_level: 1 }, function (err, rows) {
          if (err) t.fail()
          t.ok(_.isArray(rows))
          t.equal(rows.length, 2)
          t.equal(rows[0].key, 'biscuit')
          t.equal(rows[0].value, 2)
          t.equal(rows[1].key, 'cookie')
          t.equal(rows[1].value, 1)
          t.end()
        })
      })
    })
  })
})

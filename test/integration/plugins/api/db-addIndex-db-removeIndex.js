/* global emit */ //, sum */ // couchdb globals
/* eslint-disable handle-callback-err */

var _ = require('lodash')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.addIndex / db.removeIndex', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()

    var index = {
      map: function (doc) {
        emit(doc.type, 1)
      }
    }

    db.addIndex('by_type', index, function (err, data) {
      if (err) t.fail()

      t.ok(data.ok)
      t.equal(data.id, '_design/views')
      t.equal(typeof data.rev, 'string')

      db.query('by_type', function (err, rows, meta) {
        if (err) t.fail()
        t.ok(_.isArray(rows))
        t.equal(meta.total_rows, 0)
        t.equal(meta.offset, 0)

        db.removeIndex('by_type', function (err, data) {
          if (err) t.fail()
          t.ok(data.ok)
          t.equal(data.id, '_design/views')
          t.equal(typeof data.rev, 'string')

          // Now that index has been removed we shouldnt be able to
          // query the non existent view.
          db.query('by_type', function (err) {
            t.equal(err.error, 'not_found')
            t.end()
          })
        })
      })
    })
  })
})

/* global emit */ // couchdb globals
/* eslint-disable handle-callback-err */

var _ = require('lodash')
var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('db.addIndex / db.add / db.query with and without params.parse', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()

    var index = {
      map: function (doc) {
        emit(doc.type, doc)
      }
    }

    async.parallel([
      async.apply(db.add, 'biscuit', {id: 'rich-tea'}),
      async.apply(db.add, 'biscuit', {id: 'digestive'}),
      async.apply(db.add, 'cookie', {id: 'chocolate-chip'}),
      async.apply(db.addIndex, 'by_type', index)
    ], function (err) {
      if (err) t.fail()

      db.query('by_type', { parse: true }, function (err, rows, meta) {
        if (err) t.fail()
        t.ok(_.isArray(rows))
        t.equal(rows.length, 3)
        // we expect an array of parsed docs because we used the
        // `params.parse` option.
        rows.forEach(function (row) {
          t.equal(typeof row.id, 'string')
          t.equal(typeof row._rev, 'string')
          t.equal(typeof row.type, 'string')
          t.equal(typeof row.createdAt, 'string')
        })

        t.equal(meta.total_rows, 3)
        t.equal(meta.offset, 0)

        db.query('by_type', function (err, rows, meta) {
          if (err) t.fail()
          t.ok(_.isArray(rows))
          t.equal(rows.length, 3)
          // Now we expect array of standard couchdb view results as
          // we did not use `params.parse`.
          rows.forEach(function (row) {
            t.equal(typeof row.id, 'string')
            t.equal(typeof row.key, 'string')
            t.equal(typeof row.value, 'object')
            t.equal(typeof row.value._id, 'string')
            t.equal(typeof row.value._rev, 'string')
            t.equal(typeof row.value.type, 'string')
            t.equal(typeof row.value.createdAt, 'string')
          })

          t.equal(meta.total_rows, 3)
          t.equal(meta.offset, 0)

          t.end()
        })
      })
    })
  })
})

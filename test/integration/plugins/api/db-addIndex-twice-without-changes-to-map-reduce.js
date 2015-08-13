/* global emit */ // couchdb globals
/* eslint-disable handle-callback-err */
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.addIndex twice without changes to map/reduce', function (t) {
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

      db.addIndex('by_type', index, function (err, data) {
        if (err) t.fail()
        // response should be ok but note that rev is still 1 as adding
        // the exact same view more than once won't result in the design
        // document being updated in the database.
        t.equal(data.ok, true)
        t.equal(data.id, '_design/views')
        t.ok(/^1-/.test(data.rev))
        t.end()
      })
    })
  })
})

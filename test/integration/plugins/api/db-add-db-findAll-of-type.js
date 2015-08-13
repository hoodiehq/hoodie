var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.add / db.findAll of type', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()
    var doc1 = {id: 'wibble', title: 'Test Document 1'}
    var doc2 = {id: 'wobble', title: 'Test Document 2'}
    var doc3 = {id: 'wubble', title: 'Test Document 3'}
    async.parallel([
      async.apply(db.add, 'mytype', doc1),
      async.apply(db.add, 'mytype', doc2),
      async.apply(db.add, 'othertype', doc3)
    ], function (err) {
      if (err) t.fail()
      db.findAll('othertype', function (err, docs) {
        if (err) t.fail()
        t.equal(docs.length, 1)
        t.equal(docs[0].id, 'wubble')
        t.equal(docs[0].type, 'othertype')
        t.equal(docs[0].title, 'Test Document 3')
        t.end()
      })
    })
  })
})

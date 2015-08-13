var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.add / db.findAll', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()
    var doc1 = {id: 'wibble', title: 'Test Document 1'}
    var doc2 = {id: 'wobble', title: 'Test Document 2'}
    async.parallel([
      async.apply(db.add, 'mytype', doc1),
      async.apply(db.add, 'mytype', doc2)
    ], function (err) {
      if (err) t.fail()
      db.findAll(function (err, docs) {
        if (err) t.fail()
        t.equal(docs.length, 2)
        t.equal(docs[0].id, 'wibble')
        t.equal(docs[0].type, 'mytype')
        t.equal(docs[0].title, 'Test Document 1')
        t.equal(docs[1].id, 'wobble')
        t.equal(docs[1].type, 'mytype')
        t.equal(docs[1].title, 'Test Document 2')
        t.end()
      })
    })
  })
})

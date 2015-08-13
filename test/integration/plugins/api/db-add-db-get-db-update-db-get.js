var async = require('async')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('db.add / db.get / db.update / db.get', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()
    var doc = {
      id: 'asdf',
      title: 'Test Document'
    }
    async.series([
      function (cb) {
        db.add('mytype', doc, function (err, resp) {
          if (err) {
            return cb(err)
          }
          t.ok(resp.ok)
          return cb()
        })
      },
      function (cb) {
        db.find('mytype', 'asdf', function (err, doc) {
          if (err) {
            return cb(err)
          }
          t.equal(doc.id, 'asdf')
          t.equal(doc.type, 'mytype')
          t.equal(doc.title, 'Test Document')
          return cb()
        })
      },
      function (cb) {
        db.update('mytype', 'asdf', {foo: 'bar'}, cb)
      },
      function (cb) {
        db.find('mytype', 'asdf', function (err, doc) {
          if (err) {
            return cb(err)
          }
          t.equal(doc.id, 'asdf')
          t.equal(doc.type, 'mytype')
          t.equal(doc.title, 'Test Document')
          t.equal(doc.foo, 'bar')
          return cb()
        })
      }
    ], function (err) {
      if (err) t.fail()
      t.end()
    })
  })
})

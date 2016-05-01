var test = require('tap').test
var proxyquire = require('proxyquire')

test('database api factory', function (t) {
  t.test('use default adapter', function (tt) {
    function PouchDB (name) {
      this.name = name
    }
    PouchDB['@noCallThru'] = true
    PouchDB.defaults = function (db) {
      tt.is(db.foo, 'foo', 'correct pouch config passed')
      PouchDB.foo = 'foo'
      return PouchDB
    }

    var database = proxyquire('../../../lib/config/db/factory', {
      pouchdb: PouchDB
    })({db: {foo: 'foo'}})

    tt.is(database.PouchDB, PouchDB, 'exposes pouch constructor')
    tt.is(database.PouchDB.foo, 'foo', 'exposes pouch constructor with defaults')

    var db = database('db-name')

    tt.ok(db instanceof PouchDB, 'factory returns pouch instance')
    tt.is(db.name, 'db-name', 'factory returns pouch instance with name')
    tt.end()
  })

  t.test('use http adapter', function (tt) {
    function PouchDB (name) {
      this.name = name
    }
    PouchDB['@noCallThru'] = true
    PouchDB.defaults = function (db) {
      return PouchDB
    }

    var database = proxyquire('../../../lib/config/db/factory', {
      pouchdb: PouchDB
    })({db: {url: 'http://example.com'}})

    var db = database('db-name')

    tt.is(db.name, 'http://example.com/db-name', 'factory returns pouch instance with couch url')
    tt.end()
  })

  t.end()
})

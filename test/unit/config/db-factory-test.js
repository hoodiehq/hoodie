var test = require('tap').test
var proxyquire = require('proxyquire')

test('database api factory', function (group) {
  group.test('use default adapter', function (t) {
    function PouchDB (name) {
      this.name = name
    }
    PouchDB['@noCallThru'] = true
    PouchDB.defaults = function (db) {
      t.is(db.foo, 'foo', 'correct pouch config passed')
      PouchDB.foo = 'foo'
      return PouchDB
    }

    var database = proxyquire('../../../lib/config/db/factory', {
      pouchdb: PouchDB
    })({db: {foo: 'foo'}})

    t.is(database.PouchDB, PouchDB, 'exposes pouch constructor')
    t.is(database.PouchDB.foo, 'foo', 'exposes pouch constructor with defaults')

    var db = database('db-name')

    t.ok(db instanceof PouchDB, 'factory returns pouch instance')
    t.is(db.name, 'db-name', 'factory returns pouch instance with name')
    t.end()
  })

  group.test('use http adapter', function (t) {
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

    t.is(db.name, 'http://example.com/db-name', 'factory returns pouch instance with couch url')
    t.end()
  })

  group.end()
})

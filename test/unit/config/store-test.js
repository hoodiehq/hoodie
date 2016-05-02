var proxyquire = require('proxyquire')
var test = require('tap').test

var preAuthHookStub = {
  '@noCallThru': true
}
var storeConfig = proxyquire('../../../lib/config/store', {
  './pre-auth-hook': preAuthHookStub
})

test('store config', function (group) {
  group.test('with config.db.url = http://foo:bar@baz.com', function (t) {
    storeConfig({
      config: {
        db: {
          url: 'http://foo:bar@baz.com'
        },
        store: {}
      }
    }, function (error, config) {
      t.error(error)

      t.is(config.store.couchdb, 'http://baz.com', 'sets config.store.couchdb')
      t.is(config.store.PouchDB, undefined, 'does not set config.store.PouchDB')

      t.end()
    })
  })

  group.test('without config.db.url', function (t) {
    storeConfig({
      config: {
        db: {},
        store: {}
      },
      getDatabase: {
        PouchDB: 'PouchDB'
      }
    }, function (error, config) {
      t.error(error)

      t.is(config.store.PouchDB, 'PouchDB', 'sets config.store.PouchDB')
      t.is(config.store.couchdb, undefined, 'does not set config.store.couchdb')

      t.end()
    })
  })

  group.end()
})

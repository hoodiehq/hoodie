var proxyquire = require('proxyquire')
var test = require('tap').test

var preAuthHookStub = {
  '@noCallThru': true
}
var storeConfig = proxyquire('../../../lib/config/store', {
  './pre-auth-hook': preAuthHookStub
})

test('store config', function (group) {
  group.test('with config.db.url = http://foo:bar@baz.com', function (group) {
    storeConfig({
      config: {
        db: {
          url: 'http://foo:bar@baz.com'
        },
        store: {}
      }
    }, function (error, config) {
      group.error(error)

      group.is(config.store.couchdb, 'http://baz.com', 'sets config.store.couchdb')
      group.is(config.store.PouchDB, undefined, 'does not set config.store.PouchDB')

      group.end()
    })
  })

  group.test('without config.db.url', function (group) {
    storeConfig({
      config: {
        db: {},
        store: {}
      },
      getDatabase: {
        PouchDB: 'PouchDB'
      }
    }, function (error, config) {
      group.error(error)

      group.is(config.store.PouchDB, 'PouchDB', 'sets config.store.PouchDB')
      group.is(config.store.couchdb, undefined, 'does not set config.store.couchdb')

      group.end()
    })
  })

  group.end()
})

var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

test('config', function (group) {
  group.test('defaults', function (group) {
    var config = {
      db: {}
    }
    var accountConfigMock = simple.stub().callbackWith(null)
    var couchDbConfigMock = simple.stub().callbackWith(null)
    var getDatabaseFactoryMock = simple.stub().returnWith('getDatabase')
    var parseOptionsMock = simple.stub().returnWith(config)
    var pouchDbConfigMock = simple.stub().callbackWith(null)
    var storeConfigMock = simple.stub().callbackWith(null)

    var getConfig = proxyquire('../../lib/config', {
      './account': accountConfigMock,
      './db/couchdb': couchDbConfigMock,
      './db/factory': getDatabaseFactoryMock,
      './parse-options': parseOptionsMock,
      './db/pouchdb': pouchDbConfigMock,
      './store': storeConfigMock
    })

    getConfig({}, function (error, config) {
      group.error(error)

      var state = {
        config: config,
        getDatabase: 'getDatabase'
      }

      group.is(couchDbConfigMock.callCount, 0, 'couchdb config not called')
      group.same(pouchDbConfigMock.lastCall.arg, state, 'called pouchdb config')
      group.same(accountConfigMock.lastCall.arg, state, 'called account config')
      group.same(storeConfigMock.lastCall.arg, state, 'called store config')

      group.ok(pouchDbConfigMock.lastCall.k < accountConfigMock.lastCall.k, 'pouch config called before account config')
      group.ok(pouchDbConfigMock.lastCall.k < storeConfigMock.lastCall.k, 'pouch config called before store config')

      group.end()
    })
  })

  group.test('with dbUrl', function (group) {
    var config = {
      db: {
        url: 'http://foo:bar@baz.com'
      }
    }
    var accountConfigMock = simple.stub().callbackWith(null)
    var couchDbConfigMock = simple.stub().callbackWith(null)
    var getDatabaseFactoryMock = simple.stub().returnWith('getDatabase')
    var parseOptionsMock = simple.stub().returnWith(config)
    var pouchDbConfigMock = simple.stub().callbackWith(null)
    var storeConfigMock = simple.stub().callbackWith(null)

    var getConfig = proxyquire('../../lib/config', {
      './account': accountConfigMock,
      './db/couchdb': couchDbConfigMock,
      './db/factory': getDatabaseFactoryMock,
      './parse-options': parseOptionsMock,
      './db/pouchdb': pouchDbConfigMock,
      './store': storeConfigMock
    })

    getConfig({}, function (error, config) {
      group.error(error)

      var state = {
        config: config,
        getDatabase: 'getDatabase'
      }

      group.is(pouchDbConfigMock.callCount, 0, 'PouchDB config not called')
      group.same(couchDbConfigMock.lastCall.arg, state, 'called couchdb config')
      group.same(accountConfigMock.lastCall.arg, state, 'called account config')
      group.same(storeConfigMock.lastCall.arg, state, 'called store config')

      group.end()
    })
  })

  group.end()
})

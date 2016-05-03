var resolvePath = require('path').resolve

var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

test('config', function (group) {
  group.test('defaults', function (t) {
    var config = {
      paths: {
        public: 'public path'
      },
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
      './store': storeConfigMock,
      'fs': {
        statSync: simple.stub().returnWith({
          isDirectory: simple.stub()
        })
      }
    })

    getConfig({}, function (error, config) {
      t.error(error)

      var state = {
        config: config,
        getDatabase: 'getDatabase'
      }

      t.is(config.paths.public, 'public path', 'sets public path')

      t.is(couchDbConfigMock.callCount, 0, 'couchdb config not called')
      t.same(pouchDbConfigMock.lastCall.arg, state, 'called pouchdb config')
      t.same(accountConfigMock.lastCall.arg, state, 'called account config')
      t.same(storeConfigMock.lastCall.arg, state, 'called store config')

      t.ok(pouchDbConfigMock.lastCall.k < accountConfigMock.lastCall.k, 'pouch config called before account config')
      t.ok(pouchDbConfigMock.lastCall.k < storeConfigMock.lastCall.k, 'pouch config called before store config')

      t.end()
    })
  })

  group.test('with dbUrl', function (t) {
    var config = {
      paths: {
        public: 'public path'
      },
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
      './store': storeConfigMock,
      'fs': {
        statSync: simple.stub().returnWith({
          isDirectory: simple.stub()
        })
      }
    })

    getConfig({}, function (error, config) {
      t.error(error)

      var state = {
        config: config,
        getDatabase: 'getDatabase'
      }

      t.is(pouchDbConfigMock.callCount, 0, 'PouchDB config not called')
      t.same(couchDbConfigMock.lastCall.arg, state, 'called couchdb config')
      t.same(accountConfigMock.lastCall.arg, state, 'called account config')
      t.same(storeConfigMock.lastCall.arg, state, 'called store config')

      t.end()
    })
  })

  group.test('if public puth does not exist', function (t) {
    var config = {
      paths: {
        public: 'public path'
      },
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
      './store': storeConfigMock,
      'fs': {
        statSync: simple.stub().returnWith({
          isDirectory: simple.stub().throwWith(new Error())
        })
      },
      'npmlog': {
        info: simple.stub()
      }
    })

    getConfig({}, function (error, config) {
      t.error(error)

      t.is(config.paths.public, resolvePath(__dirname, '../../public'), 'defaults to hoodie/public')

      t.end()
    })
  })

  group.end()
})

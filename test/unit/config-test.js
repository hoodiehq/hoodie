var simple = require('simple-mock')
var test = require('tap').test
require('npmlog').level = 'silent'

var cwd = process.cwd()

test('config', function (t) {
  t.test('default', function (tt) {
    var getConfig = require('../../lib/config')

    getConfig({}, function (error, config) {
      tt.error(error)

      tt.is(config.name, 'hoodie', 'exposes name from package.json')
      tt.ok(config.paths.data.startsWith(cwd), 'derives hoodie path from cwd')
      tt.match(config.paths.public, cwd + '/public', 'falls back to hoodie/public')

      tt.same(config.db.prefix, cwd + '/.hoodie/data', 'uses default db config')
      tt.same(config.app, {
        hostname: '127.0.0.1',
        port: 8080,
        protocol: 'http'
      }, 'uses "http://127.0.0.1:8080/" as app url')

      tt.end()
    })
  })

  t.test('applies overwrites', function (tt) {
    var getConfig = require('../../lib/config')
    simple.mock(getConfig.internals, 'parseOptions').returnWith({
      name: 'overwritten',
      paths: {
        data: 'data-path',
        public: 'public-path'
      },
      app: {
        hostname: 'hoodie-test',
        port: 1337,
        protocol: 'http'
      },
      db: {},
      account: {},
      admin: {},
      store: {}
    })

    simple.mock(getConfig.internals, 'pouchDbConfig').callbackWith(null, {
      secret: 'secret',
      authentication_db: '_users',
      admins: {}
    })

    getConfig({
      data: 'data-path',
      public: 'public-path',
      bindAddress: 'hoodie-test',
      port: 1337
    }, function (error, config) {
      tt.error(error)

      tt.is(config.name, 'overwritten', 'exposes name from package.json')
      tt.is(config.paths.data, 'data-path', 'uses data option as data path')
      tt.is(config.paths.public, 'public-path', 'uses public option as public path')

      tt.same(config.app, {
        hostname: 'hoodie-test',
        port: 1337,
        protocol: 'http'
      }, 'uses "http://hoodie-test:1337/" as app url')

      simple.restore()
      tt.end()
    })
  })

  t.test('custom db', function (tt) {
    tt.plan(3)

    var memdown = {}
    var getConfig = require('../../lib/config')

    simple.mock(getConfig.internals, 'couchDbConfig').callbackWith(null, {
      secret: 'secret',
      authentication_db: '_users',
      admins: {}
    })
    simple.mock(getConfig.internals, 'parseOptions', function (options) {
      return {
        paths: {
          data: 'data-path'
        },
        db: {
          db: memdown
        }
      }
    })
    simple.mock(getConfig.internals, 'accountConfig').callbackWith(null)
    simple.mock(getConfig.internals, 'pouchDbConfig').callbackWith(null)
    simple.mock(getConfig.internals, 'storeConfig').callbackWith(null)

    getConfig({
      inMemory: true
    }, function (error, config) {
      tt.error(error)
      tt.is(config.db.db, memdown, 'uses memdown for in memory')
    })

    getConfig({
      dbUrl: 'http://example.com/'
    }, function (error, config) {
      simple.restore()
      tt.ok(error, 'returns error if db URL misses auth')
    })
  })

  t.end()
})

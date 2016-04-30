var test = require('tap').test
var proxyquire = require('proxyquire')
require('npmlog').level = 'silent'

var mkdirp = {
  sync: function () {},
  '@noCallThru': true
}
var cwd = process.cwd()

test('config', function (t) {
  t.test('default', function (tt) {
    var getConfig = proxyquire('../../lib/config', {mkdirp: mkdirp})

    var config = getConfig({})

    tt.is(config.name, 'hoodie', 'exposes name from package.json')
    tt.ok(config.paths.data.startsWith(cwd), 'derives hoodie path from cwd')
    tt.match(config.paths.public, cwd + '/public', 'falls back to hoodie/public')

    tt.same(config.db, {
      prefix: cwd + '/.hoodie/data/'
    }, 'uses default db config')
    tt.same(config.app, {
      hostname: '127.0.0.1',
      port: 8080,
      protocol: 'http'
    }, 'uses "http://127.0.0.1:8080/" as app url')

    tt.end()
  })

  t.test('applies overwrites', function (tt) {
    var options = {
      mkdirp: mkdirp,
      fs: {
        statSync: function () {
          return {
            isDirectory: function () {
              return true
            }
          }
        },
        '@noCallThru': true
      }
    }
    options[cwd + '/package.json'] = {
      name: 'overwritten',
      '@noCallThru': true
    }
    var getConfig = proxyquire('../../lib/config', options)

    var config = getConfig({
      data: 'data-path',
      public: 'public-path',
      bindAddress: 'hoodie-test',
      port: 1337
    })

    tt.is(config.name, 'overwritten', 'exposes name from package.json')
    tt.is(config.paths.data, 'data-path', 'uses data option as data path')
    tt.is(config.paths.public, 'public-path', 'uses public option as public path')

    tt.same(config.app, {
      hostname: 'hoodie-test',
      port: 1337,
      protocol: 'http'
    }, 'uses "http://hoodie-test:1337/" as app url')

    tt.end()
  })

  t.test('custom db', function (tt) {
    tt.plan(3)

    var memdown = {}

    var getConfig = proxyquire('../../lib/config', {
      memdown: memdown,
      mkdirp: mkdirp,
      npmlog: {
        warn: function () {
          tt.ok(true, 'warns about missing auth in db url')
        },
        info: function () {}
      }
    })

    var config = getConfig({
      dbUrl: 'http://user:pass@example.com/',
      inMemory: true
    })

    tt.is(config.db.url, 'http://user:pass@example.com/', 'uses passed db url')
    tt.is(config.db.db, memdown, 'uses memdown for in memory')

    getConfig({
      dbUrl: 'http://example.com/'
    })
  })

  t.end()
})

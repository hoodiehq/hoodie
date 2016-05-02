var proxyquire = require('proxyquire')
var test = require('tap').test

var getDefaultsMock = function () {
  return {
    name: 'foo',
    paths: {
      data: 'data path',
      public: 'public path'
    },
    app: {
      hostname: 'app hostname',
      port: 'app port',
      protocol: 'app protocol'
    }
  }
}
getDefaultsMock['@noCallThru'] = true
var logMock = {
  '@noCallThru': true,
  info: function () {}
}
var memdownMock = {
  '@noCallThru': true
}

var parseOptions = proxyquire('../../../lib/config/parse-options', {
  'memdown': memdownMock,
  'npmlog': logMock,
  './defaults': getDefaultsMock
})

test('parse options', function (group) {
  group.test('defaults', function (t) {
    var config = parseOptions({})

    t.is(config.name, 'foo', 'sets config.name from defaults')
    t.is(config.paths.data, 'data path', 'sets config.paths.data from defaults')
    t.is(config.paths.public, 'public path', 'sets config.public.data from defaults')
    t.is(config.app.hostname, 'app hostname', 'sets config.app.hostname from defaults')
    t.is(config.app.port, 'app port', 'sets config.app.port from defaults')
    t.is(config.app.protocol, 'app protocol', 'sets config.app.protocol from defaults')
    t.is(config.db.prefix, 'data path/data', 'sets config.db.prefix based on default data path')

    t.end()
  })

  group.test('overwrites', function (t) {
    var config = parseOptions({
      data: 'options.data',
      public: 'options.public',
      bindAddress: 'options.bindAddress',
      port: 'options.port'
    })

    t.is(config.paths.data, 'options.data', 'uses data option as data path')
    t.is(config.paths.public, 'options.public', 'uses public option as public path')
    t.is(config.app.hostname, 'options.bindAddress', 'sets config.app.hostname from options.bindAddress')
    t.is(config.app.port, 'options.port', 'sets config.app.port from options.port')

    t.end()
  })

  group.test('dbUrl', function (t) {
    var config = parseOptions({
      dbUrl: 'http://foo:bar@baz.com'
    })

    t.is(config.db.url, 'http://foo:bar@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('inMemory', function (t) {
    var config = parseOptions({
      inMemory: true
    })

    t.is(config.db.db, memdownMock, 'Sets config.db.db to memdown')

    t.end()
  })

  group.end()
})

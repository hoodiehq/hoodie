var pathSeperator = require('path').sep

var proxyquire = require('proxyquire')
var test = require('tap').test

var getDefaultsMock = function () {
  return {
    name: 'foo',
    paths: {
      data: 'data path',
      public: 'public path'
    },
    connection: {
      host: 'host name',
      port: 'app port'
    },
    db: {},
    client: {}
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

var parseOptions = proxyquire('../../../server/config/parse-options', {
  'memdown': memdownMock,
  'npmlog': logMock,
  './defaults': getDefaultsMock
})

test('parse options', function (group) {
  group.test('defaults', function (t) {
    var config = parseOptions({})

    t.is(config.name, 'foo', 'sets config.name from defaults')
    t.is(config.url, undefined, 'does not set config.url by default')
    t.is(config.paths.data, 'data path', 'sets config.paths.data from defaults')
    t.is(config.paths.public, 'public path', 'sets config.public.data from defaults')
    t.is(config.connection.host, 'host name', 'sets config.connection.host from defaults')
    t.is(config.connection.port, 'app port', 'sets config.connection.port from defaults')
    t.is(config.db.prefix, 'data path/data' + pathSeperator, 'sets config.db.prefix based on default data path')

    t.end()
  })

  group.test('overwrites', function (t) {
    var config = parseOptions({
      data: 'options.data',
      public: 'options.public',
      bindAddress: 'options.bindAddress',
      port: 'options.port',
      url: 'options.url'
    })

    t.is(config.paths.data, 'options.data', 'uses data option as data path')
    t.is(config.url, 'options.url', 'sets config.url from options.url')
    t.is(config.paths.public, 'options.public', 'uses public option as public path')
    t.is(config.connection.host, 'options.bindAddress', 'sets config.connection.host from options.bindAddress')
    t.is(config.connection.port, 'options.port', 'sets config.connection.port from options.port')

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

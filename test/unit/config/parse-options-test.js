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
  group.test('defaults', function (group) {
    var config = parseOptions({})

    group.is(config.name, 'foo', 'sets config.name from defaults')
    group.is(config.paths.data, 'data path', 'sets config.paths.data from defaults')
    group.is(config.paths.public, 'public path', 'sets config.public.data from defaults')
    group.is(config.app.hostname, 'app hostname', 'sets config.app.hostname from defaults')
    group.is(config.app.port, 'app port', 'sets config.app.port from defaults')
    group.is(config.app.protocol, 'app protocol', 'sets config.app.protocol from defaults')
    group.is(config.db.prefix, 'data path/data' + pathSeperator, 'sets config.db.prefix based on default data path')

    group.end()
  })

  group.test('overwrites', function (group) {
    var config = parseOptions({
      data: 'options.data',
      public: 'options.public',
      bindAddress: 'options.bindAddress',
      port: 'options.port'
    })

    group.is(config.paths.data, 'options.data', 'uses data option as data path')
    group.is(config.paths.public, 'options.public', 'uses public option as public path')
    group.is(config.app.hostname, 'options.bindAddress', 'sets config.app.hostname from options.bindAddress')
    group.is(config.app.port, 'options.port', 'sets config.app.port from options.port')

    group.end()
  })

  group.test('dbUrl', function (group) {
    var config = parseOptions({
      dbUrl: 'http://foo:bar@baz.com'
    })

    group.is(config.db.url, 'http://foo:bar@baz.com', 'Sets config.db.url')

    group.end()
  })

  group.test('inMemory', function (group) {
    var config = parseOptions({
      inMemory: true
    })

    group.is(config.db.db, memdownMock, 'Sets config.db.db to memdown')

    group.end()
  })

  group.end()
})

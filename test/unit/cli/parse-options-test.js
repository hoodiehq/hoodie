var proxyquire = require('proxyquire').noCallThru()
var test = require('tap').test

var getDefaultsMock = function () {
  return {
    hoodie: {
      name: 'foo',
      paths: {
        data: 'data path',
        public: 'public path'
      },
      db: {},
      client: {}
    }
  }
}
getDefaultsMock['@noCallThru'] = true
var logMock = {
  info: function () {}
}

var parseOptions = proxyquire('../../../cli/parse-options', {
  'npmlog': logMock,
  './defaults': getDefaultsMock
})

test('parse options', function (group) {
  group.test('unset keys', function (t) {
    var config = parseOptions({
      data: '.hoodie',
      dbAdapter: 'pouchdb-adapter-fs'
    })

    t.notOk(config.hasOwnProperty('url'), 'does not set config.url by default')
    t.is(config.inMemory, false, 'sets config.inMemory to false by default')

    t.end()
  })

  group.test('wiring', function (t) {
    var config = parseOptions({
      data: 'options.data',
      public: 'options.public',
      url: 'options.url',
      dbUrl: 'http://foo:bar@baz.com',
      inMemory: 'aNonNullString',
      adminPassword: 'secret'
    })

    t.is(config.paths.data, 'options.data', 'uses data option as data path')
    t.is(config.url, 'options.url', 'sets config.url from options.url')
    t.is(config.paths.public, 'options.public', 'uses public option as public path')
    t.is(config.inMemory, true, 'Sets config.inMemory to boolean equivalent of options.inMemory')
    t.is(config.adminPassword, 'secret', 'Sets config.adminPassword')

    t.end()
  })

  group.test('dbUrl', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'http://foo:bar@baz.com'
    })
    var defaults = config.PouchDB('hack', {skip_setup: true}).__opts
    t.is(defaults.prefix, 'http://foo:bar@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl lacking auth', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrl: 'http://baz.com'
    }))

    t.end()
  })

  group.test('inMemory', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      inMemory: true
    })

    t.is(config.inMemory, true, 'Sets config.inMemory to true')

    t.end()
  })

  group.end()
})

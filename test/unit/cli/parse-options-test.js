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
    var config = parseOptions({})

    t.notOk(config.hasOwnProperty('url'), 'does not set config.url by default')
    t.notOk(config.db.hasOwnProperty('url'), 'does not set config.db.url by default')
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
    t.is(config.db.url, 'http://foo:bar@baz.com', 'sets config.db.url from options.dbUrl')
    t.is(config.inMemory, true, 'Sets config.inMemory to boolean equivalent of options.inMemory')
    t.is(config.adminPassword, 'secret', 'Sets config.adminPassword')

    t.end()
  })

  group.end()
})

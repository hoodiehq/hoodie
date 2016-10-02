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
  group.test('defaults', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data'
    })

    t.is(config.url, undefined, 'does not set config.url by default')
    t.is(config.paths.data, 'data', 'sets config.paths.data from defaults')
    t.is(config.paths.public, 'public', 'sets config.public.data from defaults')

    t.end()
  })

  group.test('overwrites', function (t) {
    var config = parseOptions({
      data: 'options.data',
      public: 'options.public',
      url: 'options.url'
    })

    t.is(config.paths.data, 'options.data', 'uses data option as data path')
    t.is(config.url, 'options.url', 'sets config.url from options.url')
    t.is(config.paths.public, 'options.public', 'uses public option as public path')

    t.end()
  })

  group.test('dbUrl', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'http://foo:bar@baz.com'
    })

    t.is(config.db.url, 'http://foo:bar@baz.com', 'Sets config.db.url')

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


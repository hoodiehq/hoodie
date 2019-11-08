var proxyquire = require('proxyquire').noCallThru()
var test = require('tap').test

function getDefaultsMock () {
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

var logMock = {
  info: function () {},
  warn: function () {}
}

var parseOptions = proxyquire('../../../cli/parse-options', {
  npmlog: logMock,
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
      dbUrlPassword: 'I@mApassword',
      dbUrlUsername: 'I@mAusername4db',
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

  // *************
  // dbURL TESTS
  // tests that PASS
  group.test('dbUrl http with normal user/pass in url', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'http://foo:bar@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://foo:bar@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl https with normal user/pass in url', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'https://foo:bar@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'https://foo:bar@baz.com', 'Sets config.db.url')

    t.end()
  })

  // https://foo@baz.com passing
  group.test('dbUrl https with user/pass in url, username: same as the start of the url', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'https://https://foo@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'https://https:%2F%2Ffoo@baz.com', 'Sets config.db.url')

    t.end()
  })

  // @@:@@@baz.com passing
  group.test('dbUrl http with user/pass in url, user/pass only with @', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'http://@@:@@@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://%40%40:%40%40@baz.com', 'Sets config.db.url')

    t.end()
  })

  // dasds@dasdsa.com:@dsadas@dasdas@@baz.com passing
  group.test('dbUrl http with user/pass in url, tricky user/pass', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrl: 'http://das/^$ds@das!dsa.com:@dsadas@dasdas@@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://das%2F%5E%24ds%40das!dsa.com:%40dsadas%40dasdas%40@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl http with user/pass in params', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrlUsername: 'john@doe.com',
      dbUrlPassword: 'password',
      dbUrl: 'http://baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://john%40doe.com:password@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl http with user in url, password provided via params', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrlPassword: 'password',
      dbUrl: 'http://john@doe.com@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://john%40doe.com:password@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl http with user/pass in url and username in params, params override url details', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrlUsername: 'john',
      dbUrl: 'http://test:anotherpass@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://john:anotherpass@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl http with user/pass in url and pass in params, params override url details', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrlPassword: 'password',
      dbUrl: 'http://test:anotherpass@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://test:password@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl http with user/pass both in params and in url, params override url details', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrlUsername: 'john',
      dbUrlPassword: 'password',
      dbUrl: 'http://test:anotherpass@baz.com'
    })
    var defaults = config.PouchDB('hack', { skip_setup: true }).__opts
    t.is(defaults.prefix, 'http://john:password@baz.com', 'Sets config.db.url')

    t.end()
  })

  group.test('dbUrl no url is passed, with user/pass in params. Test passes and local db initialized', function (t) {
    var config = parseOptions({
      public: 'public',
      data: 'data',
      dbUrlUsername: 'john@doe.com',
      dbUrlPassword: 'pass',
      dbAdapter: 'pouchdb-adapter-fs'
    })

    t.is(config.PouchDB.preferredAdapters[0], 'fs')

    t.end()
  })

  // tests that will throw an ERROR
  group.test('dbUrl http with user/pass in url, cannot separate username and pass credentials, ":" exists more than once', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrl: 'http://jo:hn:deow::pass@baz.com'
    }))

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

  group.test('dbUrl lacking auth (@ is included in dbUrl)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrl: 'http://@baz.com'
    }))

    t.end()
  })

  group.test('dbUrl lacking username (password and symbol "@" are included in dbUrl)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrl: 'http://:dsadsa@baz.com'
    }))

    t.end()
  })

  group.test('dbUrl lacking username (password is included in provided params)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrlPassword: 'asdasda',
      dbUrl: 'http://baz.com'
    }))

    t.end()
  })

  group.test('dbUrl lacking password (username and symbol "@" are included in dbUrl)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrl: 'http://dasdad:@baz.com'
    }))

    t.end()
  })

  group.test('dbUrl lacking password (username is included in provided params)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrlUsername: 'asdasda',
      dbUrl: 'http://baz.com'
    }))

    t.end()
  })

  group.test('dbUrl lacking pass (username is included in provided params)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrlUsername: 'asdasda',
      dbUrl: 'http://baz.com'
    }))

    t.end()
  })

  group.test('dbUrl lacking pass from parameters (username is included in url)', function (t) {
    t.throws(parseOptions.bind(null, {
      public: 'public',
      data: 'data',
      dbUrl: 'http://john@doe.com@baz.com'
    }))

    t.end()
  })

  // end of dbURL TESTS
  // ****************

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

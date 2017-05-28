var simple = require('simple-mock')
var test = require('tap').test
var path = require('path')

var hapiPlugin = require('../../server')
var serverMock = {
  register: simple.stub().callbackWith(null),
  ext: simple.stub()
}

require('npmlog').level = 'error'

test('server', function (t) {
  hapiPlugin.register(serverMock, {
    paths: {
      data: '.'
    },
    plugins: [],
    app: {}
  }, function (error) {
    t.error(error)
    t.end()
  })
})

test('does not modify the passed options object', function (t) {
  var options = {
    db: {
      url: 'http://admin:admin@localhost:5984'
    },
    plugins: [],
    app: {}
  }

  hapiPlugin.register(serverMock, options, function () {})

  t.is(options.db.url, 'http://admin:admin@localhost:5984')
  t.end()
})

test('error on register is passed to callback', function (t) {
  var serverErrorMock = {
    register: simple.stub().callbackWith(new Error()),
    ext: simple.stub()
  }

  hapiPlugin.register(serverErrorMock, {
    paths: {
      data: '.'
    },
    plugins: [],
    app: {}
  }, function (error, server, options) {
    t.ok(error)
    t.end()
  })
})

test('application root with valid server module', function (t) {
  var options = {
    paths: {
      public: 'public'
    },
    plugins: [],
    app: {}
  }
  var savedPath = process.cwd()
  t.tearDown(function () {
    process.chdir(savedPath)
  })

  process.chdir(path.resolve(__dirname, '../fixture/app-dir-with-server/'))

  hapiPlugin.register(serverMock, options, function (error, server, options) {
    t.error(error)
    t.end()
  })
})

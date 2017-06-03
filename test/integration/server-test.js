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
    }
  }, function (error, config) {
    t.error(error)
    t.end()
  })
})

test('server with options without options.path (#554)', function (t) {
  hapiPlugin.register(serverMock, {}, function (error, config) {
    t.error(error)
    t.end()
  })
})

test('error on register is passed to callback', function (t) {
  var serverErrorMock = {
    register: simple.stub().callbackWith(new Error()),
    ext: simple.stub()
  }

  hapiPlugin.register(serverErrorMock, {
    paths: {
      data: '.'
    }
  }, function (error, server, options) {
    t.ok(error)
    t.end()
  })
})

test('application root with valid server module', function (t) {
  var options = {
    paths: {
      public: 'public'
    }
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

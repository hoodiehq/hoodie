var simple = require('simple-mock')
var test = require('tap').test

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

test('server with options.db.url lacking auth', function (t) {
  hapiPlugin.register(serverMock, {
    db: {
      url: 'http://localhost:5984'
    }
  }, function (error, config) {
    t.ok(error, 'fails with error')
    t.is(error.message, 'Authentication details missing from database URL: http://localhost:5984')
    t.end()
  })
})

test('does not modify the passed options object', function (t) {
  var options = {
    db: {
      url: 'http://admin:admin@localhost:5984'
    }
  }

  hapiPlugin.register(serverMock, options, function () {})

  t.is(options.db.url, 'http://admin:admin@localhost:5984')
  t.end()
})

test('server with empty options (#554)', function (t) {
  hapiPlugin.register(serverMock, {}, function (error, config) {
    t.error(error)
    t.end()
  })
})

var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

var serverMock = {
  register: simple.stub().callbackWith(null),
  ext: simple.stub()
}

require('npmlog').level = 'error'

test('server', function (t) {
  var hapiPlugin = proxyquire('../../server', {})

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
  var hapiPlugin = proxyquire('../../server', {})

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

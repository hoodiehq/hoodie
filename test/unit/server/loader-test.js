var simple = require('simple-mock')
var test = require('tap').test
var proxyquire = require('proxyquire').noCallThru()

var mockResolver = simple.stub()
var loader = proxyquire('../../../server/plugins', {
  './resolver': mockResolver
})
var registerPluginsError = new Error('Plugin Register Error')
var serverMock = {
  register: simple.stub().callbackWith(registerPluginsError)
}

test('when require.resolve errors', function (t) {
  var options = {
    paths: {
      public: 'public'
    }
  }

  var error = new Error('Unspecified error')
  mockResolver.throwWith(error)

  t.throws(function () {
    loader(serverMock, options, function () {
      t.fail('the error has not been rethrown')
    })
  }, error, 'the error is rethrown')
  t.end()
})

test('when registerPlugins errors', function (t) {
  var options = {
    paths: {
      public: 'public'
    }
  }
  var error = new Error('Module Not Found Error')
  error.code = 'MODULE_NOT_FOUND'
  mockResolver.throwWith(error)
  loader(serverMock, options, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})

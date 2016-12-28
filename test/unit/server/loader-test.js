var simple = require('simple-mock')
var test = require('tap').test
var proxyquire = require('proxyquire').noCallThru()

var mockResolver = simple.stub()
var loader = proxyquire('../../../server/plugins', {
  './resolver': mockResolver
})
var serverMock = {
  register: simple.stub().callbackWith(null)
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

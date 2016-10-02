var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

var registerPluginsMock = simple.stub().callbackWith(null)
require('npmlog').level = 'error'

var register = proxyquire('../../../server/', {
  './plugins': registerPluginsMock
}).register

test('calls callback with error if server.register fails', function (t) {
  var serverError = new Error()
  var serverMock = {
    register: simple.stub().callbackWith(serverError),
    ext: simple.stub()
  }

  register(serverMock, {
    paths: {
      data: '.'
    }
  }, function (error) {
    t.ok(error)
    t.equal(error, serverError)
    t.end()
  })
})


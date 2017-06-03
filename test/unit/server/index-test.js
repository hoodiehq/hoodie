var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test
var registerPluginsError = new Error()
var registerPluginsMock = simple.stub().callbackWith(registerPluginsError)
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
test('calls callback with error if register.registerPlugins fails', function (t) {
  var serverMock = {
    register: simple.stub().callbackWith(null),
    ext: simple.stub()
  }

  register(serverMock, {
    paths: {
      data: '.'
    }
  }, function (error) {
    t.ok(error)
    t.equal(error, registerPluginsError)
    t.end()
  })
})

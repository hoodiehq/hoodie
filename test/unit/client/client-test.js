var path = require('path')
var proxyquire = require('proxyquire').noCallThru().noPreserveCache()
var simple = require('simple-mock')
var test = require('tap').test

require('npmlog').level = 'error'

test('client', function (group) {
  var mockServer
  var client
  var createBundleHandlerStub

  group.beforeEach(function (done) {
    createBundleHandlerStub = simple.stub()

    mockServer = {
      route: simple.stub()
    }

    client = proxyquire('../../../server/plugins/client/index', {
      './bundle-handler-factory': createBundleHandlerStub
    })

    done()
  })

  group.test('always calls next()', function (t) {
    var next = simple.stub()
    client.register(mockServer, {}, next)

    t.is(next.callCount, 1, 'Calls next')
    t.end()
  })

  group.test('passes options on to the handlerFactory', function (t) {
    var optionsMock = {}
    var next = simple.stub()
    client.register(mockServer, optionsMock, next)

    var handlerArgs = createBundleHandlerStub.lastCall.args

    t.equals(handlerArgs[2], optionsMock)
    t.end()
  })

  group.test('builds targetPath from options.data + "client.js"', function (t) {
    var optionsMock = { data: '/example/path' }
    client.register(mockServer, optionsMock, simple.stub())
    var handlerArgs = createBundleHandlerStub.lastCall.args

    t.is(handlerArgs[1], path.sep + path.join('example', 'path', 'client.js'))
    t.end()
  })

  group.test('builds targetPath from folder ".hoodie" by default', function (t) {
    client.register(mockServer, {}, simple.stub())

    var handlerArgs = createBundleHandlerStub.lastCall.args
    t.is(handlerArgs[1], path.join('.hoodie', 'client.js'))
    t.end()
  })

  group.end()
})

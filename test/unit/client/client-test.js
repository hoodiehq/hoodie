var proxyquire = require('proxyquire').noCallThru().noPreserveCache()
var simple = require('simple-mock')
var test = require('tap').test

require('npmlog').level = 'error'

test('client', function (group) {
  var mockServer
  var client
  var bundleStub
  var fsStub
  var npmlogStub

  group.beforeEach(function (done) {
    npmlogStub = {
      info: simple.stub(),
      silly: simple.stub(),
      warn: simple.stub()
    }

    bundleStub = simple.stub()
    fsStub = {
      writeFile: simple.stub()
    }
    mockServer = {
      route: simple.stub()
    }

    client = proxyquire('../../../server/plugins/client/index', {
      './bundle': bundleStub,
      'fs': fsStub,
      'npmlog': npmlogStub
    })

    done()
  })

  group.test('always calls next()', function (t) {
    var next = simple.stub()
    client.register(mockServer, {config: {}}, next)

    t.is(next.callCount, 1, 'Calls next')
    t.end()
  })

  group.test('replies bundleBuffer, logs and returns when no update', function (t) {
    client.register(mockServer, {config: {}}, simple.stub())

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, false)

    var handler = extractHandlerFromServer()
    handler({}, createReplyMock(function () {
      t.is(fsStub.writeFile.callCount, 0, 'Fs doesn`t get called')
      t.is(npmlogStub.info.callCount, 1, 'Logs info')
      t.end()
    }))
  })

  group.test('only creates bundlePromise once', function (t) {
    client.register(mockServer, {config: {}}, simple.stub())

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, false)

    var handler = extractHandlerFromServer()
    handler({}, createReplyMock(function () {
      handler({}, createReplyMock(function () {
        t.is(bundleStub.callCount, 1, 'bundle only gets called once')
        t.end()
      }))
    }))
  })

  group.test('replies bundleBuffer and returns when configured inMemory', function (t) {
    client.register(mockServer, {config: { inMemory: true }}, simple.stub())

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, true)

    var handler = extractHandlerFromServer()
    handler({}, createReplyMock(function () {
      t.is(fsStub.writeFile.callCount, 0, 'fs.writeFile does not get called')
      t.end()
    }))
  })

  group.test('writes file when update', function (t) {
    client.register(mockServer, {config: {}}, simple.stub())

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, true)

    fsStub.writeFile.callbackWith(null)

    var handler = extractHandlerFromServer()
    handler({}, createReplyMock(function () {
      t.is(fsStub.writeFile.callCount, 1, 'fs.writeFile gets called to write bundle')

      var wroteBundle = fsStub.writeFile.lastCall.args[1]
      t.equals(wroteBundle, bundleBuffer, 'fs.writeFile writes the given bundleBuffer')

      t.end()
    }))
  })

  group.test('warns when fs fails', function (t) {
    client.register(mockServer, {config: {}}, simple.stub())

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, true)

    var writeError = new Error('TestError')
    fsStub.writeFile.callbackWith(writeError)

    var handler = extractHandlerFromServer()
    handler({}, createReplyMock(function () {
      t.is(npmlogStub.warn.callCount, 1, 'Logs a warning that fs failed ')
      t.end()
    }))
  })

  group.test('throws if bundleClient fails', function (t) {
    client.register(mockServer, {config: {}}, simple.stub())

    var error = new Error('testError')
    bundleStub.callbackWith(error)

    var handler = extractHandlerFromServer()
    handler({}, function (cbError) {
      t.equals(error, cbError, 'Puts error into callback')
      t.end()
    })
  })

  function extractHandlerFromServer () {
    return mockServer.route.lastCall.arg[0].handler
  }

  function createReplyMock (cb) {
    var typeStub = simple.stub().callFn(cb)
    var bytesStub = simple.stub().returnWith({type: typeStub})
    return simple.stub().returnWith({bytes: bytesStub})
  }

  group.end()
})


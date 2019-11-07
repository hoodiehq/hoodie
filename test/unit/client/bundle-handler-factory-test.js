var proxyquire = require('proxyquire').noCallThru().noPreserveCache()
var simple = require('simple-mock')
var test = require('tap').test

require('npmlog').level = 'error'

test('bundle-handler-factory', function (group) {
  var bundleStub
  var bundleWriterStub
  var npmlogStub
  var createHandler

  group.beforeEach(function (done) {
    npmlogStub = {
      info: simple.stub(),
      silly: simple.stub(),
      warn: simple.stub()
    }

    bundleStub = simple.stub()
    bundleWriterStub = simple.stub()

    createHandler = proxyquire('../../../server/plugins/client/bundle-handler-factory', {
      './bundle': bundleStub,
      './bundle-writer': bundleWriterStub,
      npmlog: npmlogStub
    })

    done()
  })

  group.test('passes clientPath, targetPath and options to bundleClient', function (t) {
    var clientPath = '/client/path'
    var targetPath = '/target/path'
    var options = {}

    var handler = createHandler(clientPath, targetPath, options)
    handler()

    t.is(bundleStub.callCount, 1, 'bundleClient gets called')
    var bundleStubArgs = bundleStub.lastCall.args

    t.is(bundleStubArgs[0], clientPath, 'passes clientPath as first argument')
    t.is(bundleStubArgs[1], targetPath, 'passes targetPath as second argument')
    t.equals(bundleStubArgs[2], options, 'passes options as third argument')

    t.end()
  })

  group.test('calls clientBundleWriter and replies bundleBuffer', function (t) {
    var targetPath = '/target/path'
    var handler = createHandler('', targetPath, { inMemory: false })

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, false)

    handler({}, createReplyMock(function () {
      t.is(bundleWriterStub.callCount, 1, 'writeClientBundle gets called')
      var bundleWriterArgs = bundleWriterStub.lastCall.args

      t.is(bundleWriterArgs[0], false, 'Passes update-flag to bundle-writer')
      t.is(bundleWriterArgs[1], false, 'Passes inMemory flag to bundle-writer')
      t.is(bundleWriterArgs[2], targetPath, 'Passes targetPath to bundle-writer')
      t.equals(bundleWriterArgs[3], bundleBuffer, 'Passes bundleBuffer to bundle-writer')
      t.end()
    }))
  })

  group.test('only creates bundlePromise once', function (t) {
    var handler = createHandler('', '', {})

    var bundleBuffer = []
    bundleStub.callbackWith(null, bundleBuffer, false)

    handler({}, createReplyMock(function () {
      handler({}, createReplyMock(function () {
        t.is(bundleStub.callCount, 1, 'bundle only gets called once')
        t.end()
      }))
    }))
  })

  group.test('throws if bundleClient fails', function (t) {
    var handler = createHandler('', '', {})

    var error = new Error('testError')
    bundleStub.callbackWith(error)

    handler({}, function (cbError) {
      t.equals(error, cbError, 'Puts error into callback')
      t.end()
    })
  })

  function createReplyMock (cb) {
    var typeStub = simple.stub().callFn(cb)
    var bytesStub = simple.stub().returnWith({ type: typeStub })
    return simple.stub().returnWith({ bytes: bytesStub })
  }

  group.end()
})

var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

test('bundle client', function (t) {
  var streamMock = {
    pipe: simple.stub(),
    on: simple.stub()
  }
  var bundleClient = proxyquire('../../lib/bundle-client', {
    npmlog: {
      silly: simple.stub(),
      info: simple.stub()
    },
    fs: {
      createReadStream: simple.stub().returnWith(streamMock),
      createWriteStream: simple.stub(),
      appendFile: simple.stub().callbackWith(null)
    }
  })

  bundleClient({
    paths: {
      data: 'data path'
    }
  }, function (error) {
    t.error(error)

    t.end()
  })

  var onEnd = streamMock.on.lastCall.args[1]
  onEnd()
})

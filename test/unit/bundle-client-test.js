var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

test('bundle client', function (group) {
  group.test('without options', function (t) {
    var streamMock = {
      pipe: simple.stub(),
      on: simple.stub()
    }
    var bundleClient = proxyquire('../../server/bundle-client', {
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

  group.test('with hoodie.client.url option', function (t) {
    var streamMock = {
      pipe: simple.stub(),
      on: simple.stub()
    }
    var appendFile = simple.stub().callbackWith(null)
    var bundleClient = proxyquire('../../server/bundle-client', {
      npmlog: {
        silly: simple.stub(),
        info: simple.stub()
      },
      fs: {
        createReadStream: simple.stub().returnWith(streamMock),
        createWriteStream: simple.stub(),
        appendFile: appendFile
      }
    })

    bundleClient({
      paths: {
        data: 'data path'
      },
      client: {
        url: 'https://example.com'
      }
    }, function (error) {
      t.error(error)

      t.is(appendFile.lastCall.args[1], '\n\nhoodie = new Hoodie({"url":"https://example.com"})', 'initialises Hoodie with https://example.com url')

      t.end()
    })

    var onEnd = streamMock.on.lastCall.args[1]
    onEnd()
  })

  group.end()
})

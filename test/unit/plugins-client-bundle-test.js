var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

require('npmlog').level = 'error'

test('bundle client', function (group) {
  group.test('client & bundle with same mtime', function (t) {
    var readFileMock = simple.stub().callbackWith(null, new Buffer('bundle content'))
    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      fs: {
        readFile: readFileMock,
        stat: simple.stub().callbackWith(null, {mtime: new Date()})
      }
    })

    bundleClient('client.js', 'bundle.js', {}, function (error) {
      t.error(error)

      t.is(readFileMock.callCount, 1, 'readFile called once')
      t.is(readFileMock.lastCall.arg, 'bundle.js', 'read bundle')

      t.end()
    })
  })

  group.test('bundle does not exist', function (t) {
    var bundleMock = simple.stub().callbackWith(null, new Buffer('hoodie client content'))
    var requireMock = simple.stub()

    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      browserify: function () {
        return {
          bundle: bundleMock,
          require: requireMock
        }
      },
      fs: {
        stat: simple.stub().callFn(function (path, callback) {
          if (path === 'client.js') {
            return callback(null, {mtime: new Date()})
          }

          callback(new Error('boom'))
        })
      }
    })

    bundleClient('client.js', 'bundle.js', {}, function (error, buffer) {
      t.error(error)

      t.is(requireMock.lastCall.arg, 'client.js', 'require client')
      t.is(bundleMock.callCount, 1, 'bundle called once')
      t.is(buffer.toString(), 'hoodie client content\n\nhoodie = new Hoodie()')

      t.end()
    })
  })

  group.test('with client options', function (t) {
    var bundleMock = simple.stub().callbackWith(null, new Buffer('hoodie client content'))
    var requireMock = simple.stub()

    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      browserify: function () {
        return {
          bundle: bundleMock,
          require: requireMock
        }
      },
      fs: {
        stat: simple.stub().callFn(function (path, callback) {
          if (path === 'client.js') {
            return callback(null, {mtime: new Date()})
          }

          callback(new Error('boom'))
        })
      }
    })

    bundleClient('client.js', 'bundle.js', {
      url: 'https://myapp.com'
    }, function (error, buffer) {
      t.error(error)

      t.is(buffer.toString(), 'hoodie client content\n\nhoodie = new Hoodie({url: "https://myapp.com"})')

      t.end()
    })
  })

  group.test('fs.readFile fails', function (t) {
    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      fs: {
        readFile: simple.stub().callbackWith(new Error('boom')),
        stat: simple.stub().callbackWith(null, {mtime: new Date()})
      }
    })

    bundleClient('client.js', 'bundle.js', {}, function (error) {
      t.is(error.message, 'boom', 'passes error')

      t.end()
    })
  })

  group.test('browserify.build failing throws error', function (t) {
    var testError = new Error('TestError')

    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      browserify: function () {
        return {
          bundle: simple.stub().callbackWith(testError),
          require: simple.stub()
        }
      },
      async: {
        parallel: simple.stub().callbackWith(null, [2, 1])
      }
    })

    bundleClient('client.js', 'bundle.js', {}, function (error) {
      t.ok(error)
      t.equal(error, testError)
      t.end()
    })
  })
  group.end()
})

var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test
var pathResolve = require('path').resolve

require('npmlog').level = 'error'

test('bundle client', function (group) {
  group.test('client & bundle with same mtime', function (t) {
    var readFileMock = simple.stub().callbackWith(null, Buffer.from('bundle content'))
    var bundleClient = proxyquire('../../../server/plugins/client/bundle', {
      fs: {
        readFile: readFileMock,
        stat: simple.stub().callbackWith(null, { mtime: new Date() })
      }
    })

    bundleClient('client.js', 'bundle.js', {
      plugins: [
        'hoodie-plugin-foobar'
      ]
    }, function (error) {
      t.error(error)

      t.is(readFileMock.callCount, 1, 'readFile called once')
      t.is(readFileMock.lastCall.arg, 'bundle.js', 'read bundle')

      t.end()
    })
  })

  group.test('bundle does not exist', function (t) {
    var bundleMock = simple.stub().callbackWith(null, Buffer.from('hoodie client content'))
    var requireMock = simple.stub()

    var streamStub = {
      push: simple.stub()
    }
    var bundleClient = proxyquire('../../../server/plugins/client/bundle', {
      browserify: function () {
        return {
          bundle: bundleMock,
          require: requireMock
        }
      },
      fs: {
        stat: simple.stub().callFn(function (path, callback) {
          if (path === 'client.js') {
            return callback(null, { mtime: new Date() })
          }

          callback(new Error('boom'))
        })
      },
      stream: {
        Readable: simple.stub().returnWith(streamStub)
      }
    })

    bundleClient('client.js', 'bundle.js', { plugins: [] }, function (error, buffer) {
      t.error(error)

      t.is(bundleMock.callCount, 1, 'bundle called once')

      var expected = 'var Hoodie = require("@hoodie/client")\n' +
                     'var options = {\n' +
                     '  url: location.origin,\n' +
                     '  PouchDB: require("pouchdb-browser")\n' +
                     '}\n' +
                     'module.exports = new Hoodie(options)\n'
      t.is(streamStub.push.calls[0].arg, expected)

      t.end()
    })
  })

  group.test('with client options', function (t) {
    var bundleMock = simple.stub().callbackWith(null, Buffer.from('hoodie client content'))
    var requireMock = simple.stub()

    var streamStub = {
      push: simple.stub()
    }
    var bundleClient = proxyquire('../../../server/plugins/client/bundle', {
      browserify: function () {
        return {
          bundle: bundleMock,
          require: requireMock
        }
      },
      fs: {
        stat: simple.stub().callFn(function (path, callback) {
          if (path === 'client.js') {
            return callback(null, { mtime: new Date() })
          }

          callback(new Error('boom'))
        })
      },
      stream: {
        Readable: simple.stub().returnWith(streamStub)
      }
    })

    bundleClient('client.js', 'bundle.js', {
      client: {
        foo: 'bar'
      },
      plugins: [],
      url: 'https://myapp.com'
    }, function (error, buffer) {
      t.error(error)

      var expected = 'var Hoodie = require("@hoodie/client")\n' +
                     'var options = {\n' +
                     '  "foo": "bar",\n' +
                     '  url: "https://myapp.com",\n' +
                     '  PouchDB: require("pouchdb-browser")\n' +
                     '}\n' +
                     'module.exports = new Hoodie(options)\n'
      t.is(streamStub.push.calls[0].arg, expected)

      t.end()
    })
  })

  group.test('fs.readFile fails', function (t) {
    var bundleClient = proxyquire('../../../server/plugins/client/bundle', {
      fs: {
        readFile: simple.stub().callbackWith(new Error('boom')),
        stat: simple.stub().callbackWith(null, { mtime: new Date() })
      }
    })

    bundleClient('client.js', 'bundle.js', { plugins: [] }, function (error) {
      t.is(error.message, 'boom', 'passes error')

      t.end()
    })
  })

  group.test('browserify.build failing throws error', function (t) {
    var testError = new Error('TestError')

    var bundleClient = proxyquire('../../../server/plugins/client/bundle', {
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

    bundleClient('client.js', 'bundle.js', { plugins: [] }, function (error) {
      t.ok(error)
      t.equal(error, testError)
      t.end()
    })
  })

  group.test('app\'s root directory is specified', function (t) {
    var bundleMock = simple.stub().callbackWith(null, Buffer.from('hoodie client content'))
    var requireMock = simple.stub()
    var unspecifiedError = new Error('UNSPECIFIED_ERROR')
    var savedPath = process.cwd()
    var resolverMock = simple.stub().callFn(function (path) {
      if (path === pathResolve(__dirname, '../../fixture/app-dir-with-server/hoodie/client')) {
        return pathResolve(__dirname, '../../fixture/app-dir-with-server/hoodie/client.js')
      }

      if (path === pathResolve(__dirname, '../../fixture/hoodie/client')) {
        throw unspecifiedError
      }

      var err = new Error('Not Found', 'MODULE_NOT_FOUND')
      err.code = 'MODULE_NOT_FOUND'
      throw err
    })

    var streamStub = {}
    var currentDate = Date.now()
    var oneHourAgo = new Date(currentDate.valueOf() - (1000 * 60 * 60))
    var twoHoursAgo = new Date(currentDate.valueOf() - (2000 * 60 * 60))
    var fsMock = {
      readFile: undefined,
      stat: undefined
    }
    var bundleClient = proxyquire('../../../server/plugins/client/bundle', {
      browserify: function () {
        return {
          bundle: bundleMock,
          require: requireMock
        }
      },
      '../resolver': resolverMock,
      fs: fsMock,
      stream: {
        Readable: simple.stub().returnWith(streamStub)
      }
    })

    t.tearDown(function () {
      process.chdir(savedPath)
    })

    t.test('client module exists and is newer', function (t) {
      streamStub.push = simple.stub()
      fsMock.stat = simple.stub().callFn(function (path, callback) {
        if (path === pathResolve(__dirname, '../../fixture/app-dir-with-server/hoodie/client.js')) {
          return callback(null, { mtime: currentDate })
        }
        if (path === 'client.js') {
          return callback(null, { mtime: twoHoursAgo })
        }

        return callback(null, { mtime: oneHourAgo })
      })
      fsMock.readFile = simple.stub()
      process.chdir(pathResolve(__dirname, '../../fixture/app-dir-with-server/'))
      bundleClient('client.js', 'bundle.js', {
        plugins: [],
        url: 'https://myapp.com'
      }, function (error, buffer) {
        t.error(error)

        t.is(fsMock.stat.callCount, 3, 'stat called thrice')
        t.is(fsMock.readFile.callCount, 0, 'readFile not called')

        var expected = 'var Hoodie = require("@hoodie/client")\n' +
          'var options = {\n' +
          '  url: "https://myapp.com",\n' +
          '  PouchDB: require("pouchdb-browser")\n' +
          '}\n' +
          'module.exports = new Hoodie(options)\n' +
          '  .plugin(require("' + pathResolve(__dirname, '../../fixture/app-dir-with-server/hoodie/client') + '"))\n'
        t.is(streamStub.push.calls[0].arg, expected)

        t.end()
      })
    })

    t.test('client module exists and is older', function (t) {
      streamStub.push = simple.stub()
      fsMock.stat = simple.stub().callFn(function (path, callback) {
        if (path === pathResolve(__dirname, '../../fixture/app-dir-with-server/hoodie/client.js')) {
          return callback(null, { mtime: oneHourAgo })
        }
        if (path === 'client.js') {
          return callback(null, { mtime: twoHoursAgo })
        }

        return callback(null, { mtime: currentDate })
      })
      fsMock.readFile = simple.stub().callbackWith(null, Buffer.from('bundle content'))
      process.chdir(pathResolve(__dirname, '../../fixture/app-dir-with-server/'))
      bundleClient('client.js', 'bundle.js', {
        plugins: [],
        url: 'https://myapp.com'
      }, function (error, buffer) {
        t.error(error)

        t.is(fsMock.stat.callCount, 3, 'stat called thrice')
        t.is(fsMock.readFile.callCount, 1, 'readFile called once')
        t.is(fsMock.readFile.lastCall.arg, 'bundle.js', 'read bundle')

        t.end()
      })
    })

    t.test('client module doesn\'t exist', function (t) {
      streamStub.push = simple.stub()
      fsMock.stat = simple.stub().callFn(function (path, callback) {
        if (path === pathResolve(__dirname, '../../fixture/app-dir-without-server/hoodie/client.js')) {
          throw new Error('Boom')
        }
        if (path === 'client.js') {
          return callback(null, { mtime: twoHoursAgo })
        }

        callback(new Error('Boom'))
      })
      fsMock.readFile = simple.stub()
      process.chdir(pathResolve(__dirname, '../../fixture/app-dir-without-server/'))
      bundleClient('client.js', 'bundle.js', {
        plugins: [],
        url: 'https://myapp.com'
      }, function (error, buffer) {
        t.error(error)

        var expected = 'var Hoodie = require("@hoodie/client")\n' +
          'var options = {\n' +
          '  url: "https://myapp.com",\n' +
          '  PouchDB: require("pouchdb-browser")\n' +
          '}\n' +
          'module.exports = new Hoodie(options)\n'
        t.is(fsMock.stat.callCount, 2, 'stat called twice')
        t.is(fsMock.readFile.callCount, 0, 'readFile not called')
        t.is(streamStub.push.calls[0].arg, expected)

        t.end()
      })
    })

    t.test('require.resolve rethrows other errors', function (t) {
      streamStub.push = simple.stub()
      fsMock.readFile = simple.stub()
      process.chdir(pathResolve(__dirname, '../../fixture/'))
      t.throws(function () {
        bundleClient('client.js', 'bundle.js', {
          plugins: [],
          url: 'https://myapp.com'
        }, function () {
          t.fail()
        })
      }, unspecifiedError)
      t.end()
    })

    t.end()
  })

  group.end()
})

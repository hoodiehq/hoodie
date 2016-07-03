var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

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
    var readFileMock = simple.stub().callbackWith(null, new Buffer('hoodie client content'))
    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      fs: {
        readFile: readFileMock,
        stat: simple.stub().callFn(function (path, callback) {
          if (path === 'client.js') {
            return callback(null, {mtime: new Date()})
          }

          callback(new Error('boom'))
        })
      }
    })

    bundleClient('client.js', 'bundle.js', {
      connection: {
        host: '127.0.0.1',
        port: 8080
      }
    }, function (error, buffer) {
      t.error(error)

      t.is(readFileMock.callCount, 1, 'readFile called once')
      t.is(readFileMock.lastCall.arg, 'client.js', 'read bundle')
      t.is(buffer.toString(), 'hoodie client content\n\nhoodie = new Hoodie({"url":"http://127.0.0.1:8080"})')

      t.end()
    })
  })

  group.test('with client options', function (t) {
    var readFileMock = simple.stub().callbackWith(null, new Buffer('hoodie client content'))
    var bundleClient = proxyquire('../../server/plugins/client/bundle', {
      fs: {
        readFile: readFileMock,
        stat: simple.stub().callFn(function (path, callback) {
          if (path === 'client.js') {
            return callback(null, {mtime: new Date()})
          }

          callback(new Error('boom'))
        })
      }
    })

    bundleClient('client.js', 'bundle.js', {
      client: {
        foo: 'bar'
      }
    }, function (error, buffer) {
      t.error(error)

      t.is(buffer.toString(), 'hoodie client content\n\nhoodie = new Hoodie({"foo":"bar"})')

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

  group.end()
})

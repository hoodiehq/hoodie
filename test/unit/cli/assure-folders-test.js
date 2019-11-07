var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test

var pathMock = {
  sep: '--sep--',
  join: function () { return 'joined-path' }
}

test('assure folders', function (group) {
  group.test('default settings', function (t) {
    var mkdirpMock = simple.stub().callbackWith(null)
    var assureFolders = proxyquire('../../../cli/assure-folders', {
      path: pathMock,
      mkdirp: mkdirpMock
    })
    assureFolders({
      data: 'data'
    }, function (error) {
      t.error(error)

      t.is(mkdirpMock.callCount, 2, 'created two folders')
      t.is(mkdirpMock.calls[0].arg, 'data')
      t.is(mkdirpMock.calls[1].arg, 'joined-path--sep--')

      t.end()
    })
  })

  group.test('inMemory', function (t) {
    var mkdirpMock = simple.stub().callbackWith(null)
    var assureFolders = proxyquire('../../../cli/assure-folders', {
      path: pathMock,
      mkdirp: mkdirpMock
    })
    assureFolders({
      inMemory: true
    }, function (error) {
      t.error(error)

      t.is(mkdirpMock.callCount, 0, 'no folders created')

      t.end()
    })
  })

  group.test('dbUrl', function (t) {
    var mkdirpMock = simple.stub().callbackWith(null)
    var assureFolders = proxyquire('../../../cli/assure-folders', {
      path: pathMock,
      mkdirp: mkdirpMock
    })
    assureFolders({
      dbUrl: 'http://example.com'
    }, function (error) {
      t.error(error)

      t.is(mkdirpMock.callCount, 1, 'one created')

      t.end()
    })
  })

  group.end()
})

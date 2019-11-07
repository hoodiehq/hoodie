var proxyquire = require('proxyquire').noCallThru()
var simple = require('simple-mock')
var test = require('tap').test
var path = require('path')

var fsMock = {
  existsSync: simple.stub(),
  statSync: simple.stub()
}

var statsMock = {
  isDirectory: simple.stub()
}

test('webroot locator', function (group) {
  var webrootLocator = proxyquire('../../../cli/webroot-locator', {
    fs: fsMock
  })

  group.afterEach(function (done) {
    fsMock.existsSync.actions = []
    fsMock.existsSync.reset()
    fsMock.statSync.actions = []
    fsMock.statSync.reset()
    statsMock.isDirectory.actions = []
    statsMock.isDirectory.reset()
    done()
  })

  group.test('will return the passed location if it exists and is a directory', function (t) {
    fsMock.existsSync.returnWith(true)
    fsMock.statSync.returnWith(statsMock)
    statsMock.isDirectory.returnWith(true)

    var configuredLocation = 'i-exist'
    var webroot = webrootLocator(configuredLocation)

    t.equal(fsMock.existsSync.lastCall.args[0], configuredLocation, 'path existence check')
    t.equal(statsMock.isDirectory.callCount, 1, 'path directory check')
    t.equal(webroot, configuredLocation, 'correct location returned')

    t.end()
  })

  group.test('will return the default if the passed location exists but is not a directory', function (t) {
    fsMock.existsSync.returnWith(true)
    fsMock.statSync.returnWith(statsMock)
    statsMock.isDirectory.returnWith(false)

    var configuredLocation = 'im-a-file'
    var webroot = webrootLocator(configuredLocation)

    t.equal(fsMock.existsSync.lastCall.args[0], configuredLocation, 'path existence check')
    t.equal(statsMock.isDirectory.callCount, 1, 'path directory check')
    t.equal(webroot, path.resolve(__dirname, '../../../public'), 'correct location returned')

    t.end()
  })

  group.test('will return the default if the passed location does not exist', function (t) {
    fsMock.existsSync.returnWith(false)

    var configuredLocation = 'i-cant-be-found'
    var webroot = webrootLocator(configuredLocation)

    t.equal(fsMock.existsSync.lastCall.args[0], configuredLocation, 'path existence check')
    t.equal(fsMock.statSync.callCount, 0, 'no stat check')
    t.equal(webroot, path.resolve(__dirname, '../../../public'), 'correct location returned')

    t.end()
  })

  group.end()
})

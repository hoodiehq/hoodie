var proxyquire = require('proxyquire').noCallThru().noPreserveCache()
var simple = require('simple-mock')
var test = require('tap').test

require('npmlog').level = 'error'

test('bundle-writer', function (group) {
  var fsStub
  var npmlogStub
  var writeClientBundle

  group.beforeEach(function (done) {
    npmlogStub = {
      info: simple.stub(),
      silly: simple.stub(),
      warn: simple.stub()
    }

    fsStub = {
      writeFile: simple.stub()
    }

    writeClientBundle = proxyquire('../../../server/plugins/client/bundle-writer', {
      fs: fsStub,
      npmlog: npmlogStub
    })

    done()
  })

  group.test('logs and doesnt write bundle when noUpdate', function (t) {
    writeClientBundle(false, false, '', [])

    t.is(fsStub.writeFile.callCount, 0, 'Fs doesn`t get called')
    t.is(npmlogStub.info.callCount, 1, 'Logs info')
    t.end()
  })

  group.test('doesnt write when configured inMemory', function (t) {
    writeClientBundle(true, true, '', [])

    t.is(fsStub.writeFile.callCount, 0, 'fs.writeFile does not get called')
    t.end()
  })

  group.test('writes file to targetPath when update', function (t) {
    var targetPath = '/target/path'
    var bufferMock = []
    fsStub.writeFile.callbackWith(null)

    writeClientBundle(true, false, targetPath, bufferMock)

    t.is(fsStub.writeFile.callCount, 1, 'fs.writeFile gets called to write bundle')

    var fsArgs = fsStub.writeFile.lastCall.args
    t.equals(fsArgs[0], targetPath, 'fs.writeFile writes to the specified path')
    t.equals(fsArgs[1], bufferMock, 'fs.writeFile writes the given bundleBuffer')

    t.end()
  })

  group.test('warns when fs fails', function (t) {
    var writeError = new Error('TestError')
    fsStub.writeFile.callbackWith(writeError)

    writeClientBundle(true, false, '', [])
    t.is(npmlogStub.warn.callCount, 1, 'Logs a warning that fs failed ')
    t.end()
  })

  group.end()
})

var expect = require('expect.js')

var server = require('../../lib/server/index')

require('tap').mochaGlobals()
describe('server', function () {
  it('should export a module', function () {
    expect(server).to.be.a(Function)
  })
})

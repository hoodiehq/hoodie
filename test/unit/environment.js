var expect = require('expect.js')

var config = require('../../lib/core/config')

require('tap').mochaGlobals()
describe('environment', function () {
  it('should expose config function', function () {
    expect(config).to.be.a(Function)
  })
})

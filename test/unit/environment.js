var _ = require('lodash')
var expect = require('expect.js')

var env = require('../../lib/core/environment')

require('tap').mochaGlobals()
describe('environment', function () {
  it('should expose n number of properties', function () {
    expect(_.size(env)).to.eql(1)
  })

  it('should have a getConfig property', function () {
    expect(env).to.have.property('getConfig')
  })
})

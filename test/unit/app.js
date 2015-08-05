var _ = require('lodash')
var expect = require('expect.js')

var app = require('../../lib/index')

require('tap').mochaGlobals()
describe('Application', function () {
  it('should expose n number of properties', function () {
    expect(_.size(app)).to.eql(2)
  })

  it('should have a init property', function () {
    expect(app).to.have.property('init')
  })

  it('should have a start property', function () {
    expect(app).to.have.property('start')
  })
})

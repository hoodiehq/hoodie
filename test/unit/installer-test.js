var _ = require('lodash')
var expect = require('expect.js')

var installer = require('../../lib/couchdb/installer')

describe('installer', function () {
  it('should expose n number of properties', function () {
    expect(_.size(installer)).to.eql(5)
  })

  it('should have a setupUsers property', function () {
    expect(installer).to.have.property('setupUsers')
  })

  it('should have a setupApp property', function () {
    expect(installer).to.have.property('setupApp')
  })

  it('should have a setupPlugins property', function () {
    expect(installer).to.have.property('setupPlugins')
  })

  it('should have a install property', function () {
    expect(installer).to.have.property('install')
  })
})

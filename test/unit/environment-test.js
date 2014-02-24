var expect = require('expect.js');
var env = require('../../lib/core/environment');

var _ = require('lodash');

describe('environment', function () {

  it('should expose n number of properties', function () {
    expect(_.size(env)).to.eql(2);
  });

  it('should have a getConfig property', function () {
    expect(env).to.have.property('getConfig');
  });

  it('should have a getCouch property', function () {
    expect(env).to.have.property('getCouch');
  });

});

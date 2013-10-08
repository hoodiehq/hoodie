var expect = require('expect.js');
var env = require('../../lib/environment');

var _ = require('underscore');

describe('environment', function () {

  it('should expose n number of properties', function () {
    expect(_.size(env)).to.eql(3);
  });

  it('should have a getConfig property', function () {
    expect(env).to.have.property('getConfig');
  });

  it('should have a isNodejitsu property', function () {
    expect(env).to.have.property('isNodejitsu');
  });

  it('should have a getCouch property', function () {
    expect(env).to.have.property('getCouch');
  });

});

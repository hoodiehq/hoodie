var expect = require('expect.js');
var env = require('../../lib/environment');

describe('environment', function () {

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

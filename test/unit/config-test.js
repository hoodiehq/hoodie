var expect = require('expect.js');
var config = require('../../lib/core/config');

var _ = require('lodash');

describe('config', function () {

  it('should expose n number of properties', function () {
    expect(_.size(config)).to.eql(13);
  });

  it('should have a path property', function () {
    expect(config).to.have.property('path');
  });

  it('should have a read property', function () {
    expect(config).to.have.property('read');
  });

  it('should have a write property', function () {
    expect(config).to.have.property('write');
  });

  it('should have a get property', function () {
    expect(config).to.have.property('get');
  });

  it('should have a set property', function () {
    expect(config).to.have.property('set');
  });

  it('should have a getCouchPassword property', function () {
    expect(config).to.have.property('getCouchPassword');
  });

  it('should have a getCouchUsername property', function () {
    expect(config).to.have.property('getCouchUsername');
  });

  it('should have a getCouchCredentials property', function () {
    expect(config).to.have.property('getCouchCredentials');
  });

  it('should have a setCouchPassword property', function () {
    expect(config).to.have.property('setCouchPassword');
  });

  it('should have a setCouchUsername property', function () {
    expect(config).to.have.property('setCouchUsername');
  });

  it('should have a setCouchCredentials property', function () {
    expect(config).to.have.property('setCouchCredentials');
  });

  it('should have a setProperty property', function () {
    expect(config).to.have.property('setProperty');
  });

  it('should have a getProperty property', function () {
    expect(config).to.have.property('getProperty');
  });

});

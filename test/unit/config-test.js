var expect = require('expect.js');
var configStore = require('../../lib/core/config_store');

var _ = require('lodash');

describe('configStore', function () {

  it('should expose n number of properties', function () {
    expect(_.size(configStore)).to.eql(13);
  });

  it('should have a path property', function () {
    expect(configStore).to.have.property('path');
  });

  it('should have a read property', function () {
    expect(configStore).to.have.property('read');
  });

  it('should have a write property', function () {
    expect(configStore).to.have.property('write');
  });

  it('should have a get property', function () {
    expect(configStore).to.have.property('get');
  });

  it('should have a set property', function () {
    expect(configStore).to.have.property('set');
  });

  it('should have a getCouchPassword property', function () {
    expect(configStore).to.have.property('getCouchPassword');
  });

  it('should have a getCouchUsername property', function () {
    expect(configStore).to.have.property('getCouchUsername');
  });

  it('should have a getCouchCredentials property', function () {
    expect(configStore).to.have.property('getCouchCredentials');
  });

  it('should have a setCouchPassword property', function () {
    expect(configStore).to.have.property('setCouchPassword');
  });

  it('should have a setCouchUsername property', function () {
    expect(configStore).to.have.property('setCouchUsername');
  });

  it('should have a setCouchCredentials property', function () {
    expect(configStore).to.have.property('setCouchCredentials');
  });

  it('should have a setProperty property', function () {
    expect(configStore).to.have.property('setProperty');
  });

  it('should have a getProperty property', function () {
    expect(configStore).to.have.property('getProperty');
  });

});

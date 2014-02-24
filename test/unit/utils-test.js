var expect = require('expect.js');
var utils = require('../../lib/utils');
var _ = require('lodash');

describe('utils', function () {

  it('should expose n number of properties', function () {
    expect(_.size(utils)).to.eql(7);
  });

  it('should have a generatePassword property', function () {
    expect(utils).to.have.property('generatePassword');
  });

  it('should have a ensureDir property', function () {
    expect(utils).to.have.property('ensureDir');
  });

  it('should have a jsonClone property', function () {
    expect(utils).to.have.property('jsonClone');
  });

  it('should have a ensurePaths property', function () {
    expect(utils).to.have.property('ensurePaths');
  });

  it('should have a processSend property', function () {
    expect(utils).to.have.property('processSend');
  });

  it('should have a isNodejitsu property', function () {
    expect(utils).to.have.property('isNodejitsu');
  });

  it('should have a hconsole property', function () {
    expect(utils).to.have.property('hconsole');
  });

});

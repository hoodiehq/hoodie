var expect = require('expect.js');
var utils = require('../../lib/utils');

describe('utils', function () {

  it('should have a ensureDir property', function () {
    expect(utils).to.have.property('ensureDir');
  });

  it('should have a jsonClone property', function () {
    expect(utils).to.have.property('jsonClone');
  });

  it('should have a redirect property', function () {
    expect(utils).to.have.property('redirect');
  });

  it('should have a ensurePaths property', function () {
    expect(utils).to.have.property('ensurePaths');
  });

  it('should have a exitIfSudo property', function () {
    expect(utils).to.have.property('exitIfSudo');
  });

  it('should have a writeConfig property', function () {
    expect(utils).to.have.property('writeConfig');
  });

});

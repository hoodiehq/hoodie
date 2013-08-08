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

});

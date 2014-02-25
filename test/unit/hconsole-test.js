var expect = require('expect.js');
var hconsole = require('../../lib/utils/hconsole');

var _ = require('lodash');

describe('hconsole', function () {

  it('should expose n number of properties', function () {
    expect(_.size(hconsole)).to.eql(5);
  });

  it('should have a announce property', function () {
    expect(hconsole).to.have.property('announce');
  });

  it('should have a linebreak property', function () {
    expect(hconsole).to.have.property('linebreak');
  });

  it('should have a spinner property', function () {
    expect(hconsole).to.have.property('spinner');
  });

  it('should have a error property', function () {
    expect(hconsole).to.have.property('error');
  });

  it('should have a hr property', function () {
    expect(hconsole).to.have.property('hr');
  });

});

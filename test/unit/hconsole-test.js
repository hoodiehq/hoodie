var expect = require('expect.js');
var hconsole = require('../../lib/hconsole');

describe('hconsole', function () {

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

});

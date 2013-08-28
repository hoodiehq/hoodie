var expect = require('expect.js');

describe('Application', function () {

  beforeEach(function () {
    this.sandbox.spy(this.app.init);
  });

  it('should have a init property', function () {
    expect(this.app).to.have.property('init');
  });

  it('should have a writeConfig property', function () {
    expect(this.app).to.have.property('writeConfig');
  });

});

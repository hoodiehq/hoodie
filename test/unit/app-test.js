var expect = require('expect.js');

var _ = require('lodash');

describe('Application', function () {

  beforeEach(function () {
    this.sandbox.spy(this.app.init);
  });

  it('should expose n number of properties', function () {
    expect(_.size(this.app)).to.eql(2);
  });

  it('should have a init property', function () {
    expect(this.app).to.have.property('init');
  });

  it('should have a start property', function () {
    expect(this.app).to.have.property('start');
  });

});

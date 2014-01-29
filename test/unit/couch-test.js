var expect = require('expect.js');
var couch = require('../../lib/couchdb/index');

var _ = require('underscore');

describe('couch', function () {

  it('should expose n number of properties', function () {
    expect(_.size(couch)).to.eql(6);
  });

  it('should have a startMultiCouch property', function () {
    expect(couch).to.have.property('startMultiCouch');
  });

  it('should have a pollCouch property', function () {
    expect(couch).to.have.property('pollCouch');
  });

  it('should have a checkCouchVersion property', function () {
    expect(couch).to.have.property('checkCouchVersion');
  });

  it('should have a start property', function () {
    expect(couch).to.have.property('start');
  });

  it('should have a stop property', function () {
    expect(couch).to.have.property('stop');
  });

  it('should have a installer property', function () {
    expect(couch).to.have.property('installer');
  });
});

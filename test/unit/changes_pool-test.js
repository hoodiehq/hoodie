var expect = require('expect.js');
var cp = require('../../lib/couchdb/changes_pool');

describe('changes_pool', function () {

  it('should have a create property', function () {
    expect(cp).to.have.property('create');
  });

  it('should have a doRequests property', function () {
    expect(cp).to.have.property('doRequests');
  });

  it('should have a requestChanges property', function () {
    expect(cp).to.have.property('requestChanges');
  });

  it('should have a addToPool property', function () {
    expect(cp).to.have.property('addToPool');
  });

  it('should have a removeDB property', function () {
    expect(cp).to.have.property('removeDB');
  });

  it('should have a refreshDB property', function () {
    expect(cp).to.have.property('refreshDB');
  });

  it('should have a refreshOldest property', function () {
    expect(cp).to.have.property('refreshOldest');
  });

  it('should have a updateSince property', function () {
    expect(cp).to.have.property('updateSince');
  });

});

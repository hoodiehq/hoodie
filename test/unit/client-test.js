var expect = require('expect.js');
var client = require('../../lib/client');

describe('client', function () {

  it('should have a createClient property', function () {
    expect(client).to.have.property('createClient');
  });

  it('should have a createCouchClient property', function () {
    expect(client).to.have.property('createCouchClient');
  });

  it('should have a dbUpdatesAvailable property', function () {
    expect(client).to.have.property('dbUpdatesAvailable');
  });

});

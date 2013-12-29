var expect = require('expect.js');
var client = require('../../lib/couchdb/client');

var _ = require('underscore');

describe('client', function () {

  it('should expose n number of properties', function () {
    expect(_.size(client)).to.eql(2);
  });

  it('should have a createClient property', function () {
    expect(client).to.have.property('createClient');
  });

  it('should have a createCouchClient property', function () {
    expect(client).to.have.property('createCouchClient');
  });

});

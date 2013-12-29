var expect = require('expect.js');
var dbUpdates = require('../../lib/couchdb/db_updates');

describe('db_updates', function () {

  it('should have a listen property', function () {
    expect(dbUpdates).to.have.property('listen');
  });

});

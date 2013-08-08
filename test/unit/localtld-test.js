var expect = require('expect.js');
var localtld = require('../../lib/localtld');

describe('localtld', function () {

  it('should export a module', function () {
    expect(localtld).to.be.an(Function);
  });

});

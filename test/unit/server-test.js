var expect = require('expect.js');
var server = require('../../lib/server');

describe('server', function () {

  it('should export a module', function () {
    expect(server).to.be.an(Function);
  });

});

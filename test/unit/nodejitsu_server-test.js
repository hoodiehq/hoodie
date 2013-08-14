var expect = require('expect.js');
var nju = require('../../lib/nodejitsu_server');

describe('nodejitsu_server', function () {

  it('should export a module', function () {
    expect(nju).to.be.an(Function);
  });

});

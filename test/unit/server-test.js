var expect = require('expect.js');
var server = require('../../lib/server/index');

var _ = require('lodash');

describe('server', function () {

  it('should expose n number of properties', function () {
    expect(_.size(server)).to.eql(1);
  });

  it('should export a module', function () {
    expect(server).to.be.an(Function);
  });

});

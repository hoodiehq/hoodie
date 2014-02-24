var expect = require('expect.js');
var nju = require('../../lib/server/nodejitsu_server');

var _ = require('lodash');

describe('nodejitsu_server', function () {

  it('should expose n number of properties', function () {
    expect(_.size(nju)).to.eql(2);
  });

  it('should export a module', function () {
    expect(nju).to.be.an(Function);
  });

});

var expect = require('expect.js');
var localtld = require('../../lib/utils/localtld');

var _ = require('lodash');

describe('localtld', function () {

  it('should expose n number of properties', function () {
    expect(_.size(localtld)).to.eql(2);
  });

  it('should export a module', function () {
    expect(localtld).to.be.an(Function);
  });

});

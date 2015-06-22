var expect = require('expect.js');
var hoodie_server = require('../../');

var config = require('../support/test-config');

describe('handle assets', function () {
  this.timeout(30000);

  before(function (done) {
    hoodie_server.start(config, done);
  });

  it('should start server', function (done) {
    done();
  });

});

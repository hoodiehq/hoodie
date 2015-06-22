var expect = require('expect.js');
var hoodie_server = require('../../');

var config = {
  www_port: 5001,
  admin_port: 5011,
  admin_password: '12345'
};

describe('handle assets', function () {
  this.timeout(30000);

  before(function (done) {
    hoodie_server.start(config, done);
  });

  it('should start server', function (done) {
    done();
  });

});

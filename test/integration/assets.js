var expect = require('expect.js');
var hoodie_server = require('../../');
var http = require('http');
var os = require('os');

var config = {
  www_port: 5031,
  admin_port: 5041,
  admin_password: '12345'
};

describe('handle assets', function () {

  before(function (done) {
    hoodie_server.start(config, done);
  });

  // TODO: I guess we should kill the server once we are done with the tests
  //after(function (done) {});

  it('should get asset path', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/_api/_plugins/_assets/index.html',
    }, function (res) {
      expect(res.statusCode).to.be(200);
      done();
    });
  });

});

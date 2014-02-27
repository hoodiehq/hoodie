var expect = require('expect.js');
var hoodie_server = require('../../');
var http = require('http');
var os = require('os');

var config = {
  www_port: 5011,
  admin_port: 5021,
  admin_password: '12345'
};

describe('handle 404', function () {

  before(function (done) {
    hoodie_server.start(config, done);
  });

  // TODO: I guess we should kill the server once we are done with the tests
  //after(function (done) {});

  it('should send index.html on accept: text/html', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/does_not_exist',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, function (res) {
      var buf = '';
      res.on('data', function (chunk) { buf += chunk});
      res.on('end', function () {
        expect(buf).to.be('hi' + os.EOL);
        done();
      });
    });
  });


  it('should send a JSON 404 on anything but accept: text/html*', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/does_not_exist',
      headers: {
        accept: 'application/json'
      }
    }, function (res) {
      var buf = '';
      res.on('data', function (chunk) { buf += chunk});
      res.on('end', function () {
        buf = JSON.parse(buf);
        expect(buf.statusCode).to.be(404);
        expect(buf.error).to.be('Not Found');
        done();
      });
    });
  });
});

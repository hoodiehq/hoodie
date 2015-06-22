var expect = require('expect.js');
var hoodie_server = require('../../');
var http = require('http');

var config = require('../support/test-config');

describe('handle 404', function () {
  this.timeout(30000);

  it('should send index.html on accept: text/html', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/does_not_exist',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      agent: false
    }, function (res) {
      var buf = '';
      res.on('data', function (chunk) { buf += chunk; });
      res.on('end', function () {
        expect(buf).to.be('hi\n');
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
      },
      agent: false
    }, function (res) {
      var buf = '';
      res.on('data', function (chunk) { buf += chunk; });
      res.on('end', function () {
        buf = JSON.parse(buf);
        expect(buf.statusCode).to.be(404);
        expect(buf.error).to.be('Not Found');
        done();
      });
    });
  });
});

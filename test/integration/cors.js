var expect = require('expect.js');
var hoodie_server = require('../../');
var http = require('http');
var os = require('os');

var config = require('../support/test-config');

describe('setting CORS headers', function () {
  this.timeout(30000);

  it('should respond to OPTIONS with the right CORS headers when no origin is given', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'options',
      path: '/_api/_session/',
      agent: false
    }, function (res) {
      expect(res.headers['access-control-allow-origin']).to.be('*');
      expect(res.headers['access-control-allow-headers']).to.be('authorization, content-length, content-type, if-match, if-none-match, origin, x-requested-with, host, connection, transfer-encoding');
      expect(res.headers['access-control-expose-headers']).to.be('content-type, content-length, etag');
      expect(res.headers['access-control-allow-methods']).to.be('GET, PUT, POST, DELETE');
      expect(res.headers['access-control-allow-credentials']).to.be('true');

      expect(res.statusCode).to.be(200);
      done();
    });
  });

  it('should echo the origin back if one is given', function (done) {
    http.get({
      host: '127.0.0.1',
      port: config.www_port,
      method: 'get',
      path: '/_api/_session/',
      headers: {
        origin: 'http://some.app.com/'
      },
      agent: false
    }, function (res) {
      expect(res.headers['access-control-allow-origin']).to.be('http://some.app.com/');
      expect(res.headers['access-control-allow-headers']).to.be('authorization, content-length, content-type, if-match, if-none-match, origin, x-requested-with, host, connection');
      expect(res.headers['access-control-expose-headers']).to.be('content-type, content-length, etag');
      expect(res.headers['access-control-allow-methods']).to.be('GET, PUT, POST, DELETE');
      expect(res.headers['access-control-allow-credentials']).to.be('true');

      expect(res.statusCode).to.be(200);
      done();
    });
  });

});

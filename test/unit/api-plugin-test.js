var _ = require('lodash');
var Events = require('events');
var expect = require('expect.js');
var Wreck = require('wreck');

var plugin = require('../../lib/server/hapi_plugins/api');
var pluginInternals = require('../../lib/server/hapi_plugins/api/internals');


describe('api plugin', function () {

  it('should expose n number of properties', function () {
    expect(_.size(plugin)).to.eql(1);
  });

  it('should export a register function', function () {
    expect(plugin.register).to.be.a(Function);
  });

  describe('mapProxyPath', function () {
    var couchCfg = {
      url: 'http://couch.somewhere:1234'
    };

    it('should prepend the couchCfg url', function () {
      pluginInternals.mapProxyPath(couchCfg, {
        headers: {},
        url: {
          path: '/_api/some/path'
        }
      }, function (arg1, url) {
        expect(url).to.eql('http://couch.somewhere:1234/some/path');
      });
    });

    it('should pass the headers through', function () {
      pluginInternals.mapProxyPath(couchCfg, {
        headers: {
          some: 'header'
        },
        url: {
          path: '/_api/some/path'
        }
      }, function (arg1, url, headers) {
        expect(headers.some).to.eql('header');
      });
    });

    it('should strip any cookies', function () {
      pluginInternals.mapProxyPath(couchCfg, {
        headers: {
          some: 'header',
          cookie: 'strip-me'
        },
        url: {
          path: '/_api/some/path'
        }
      }, function (arg1, url, headers) {
        expect(headers.cookie).to.be.an('undefined');
      });
    });

    it('should move any bearer token to the cookie', function () {
      pluginInternals.mapProxyPath(couchCfg, {
        headers: {
          some: 'header',
          cookie: 'strip-me',
          authorization: 'Bearer my-token'
        },
        url: {
          path: '/_api/some/path'
        }
      }, function (arg1, url, headers) {
        expect(headers.cookie).to.eql('AuthSession=my-token');
      });
    });
  });

  describe('extractToken', function () {
    it('should return the token if there is one', function () {
      var ret = pluginInternals.extractToken(['AuthSession=some-token; Version=bla bla bla']);
      expect(ret).to.eql('some-token');
    });

    it('should return undefined if there is none', function () {
      var ret = pluginInternals.extractToken(['Some=other-cookie; Version=bla bla bla']);
      expect(ret).to.be.an('undefined');
    });
  });

  describe('addCorseAndBearerToken', function () {
    it('should return a 500 if there is an error', function (done) {
      pluginInternals.addCorsAndBearerToken('something went wrong', {}, {}, function (err) {
        expect(err).to.eql('something went wrong');
        return {
          code: function(statusCode) {
            expect(statusCode).to.eql(500);
            done();
          }
        };
      });
    });

    it('should return a 500 if wreck.read fails', function (done) {
      var res = new Events.EventEmitter();
      res.pipe = function () { };

      pluginInternals.addCorsAndBearerToken(null, res, { headers: {} }, function (err) {
        expect(err.isBoom).to.eql(true);
        return {
          code: function(statusCode) {
            expect(statusCode).to.eql(500);
            done();
          }
        };
      });
      res.emit('error', new Error('my error'));
    });

    it('should call reply and hold', function (done) {
      var stream = Wreck.toReadableStream('{"the":"body"}');
      stream.headers = {};
      stream.statusCode = 200;

      pluginInternals.addCorsAndBearerToken(null, stream, { headers: {} }, function (data) {
        var fixture = '{"the":"body"}';
        expect(data.toString()).to.eql(fixture);
        return {
          code: function(statusCode) {
            expect(statusCode).to.eql(200);
            return {
              hold: function () {
                function Resp() {}
                Resp.prototype.send = function() {
                  expect(this.headers).to.be.an('object');
                  done();
                };
                return new Resp();
              }
            };
          }
        };
      });
    });

    it('should set status 200 for OPTIONS requests', function (done) {
      var stream = Wreck.toReadableStream('{"the":"body"}');

      stream.headers = {
        some: 'header',
      };
      stream.statusCode = 405;
      pluginInternals.addCorsAndBearerToken(null, stream, { method: 'options', headers: {} }, function (data) {
        var fixture = '{"the":"body"}';
        expect(data.toString()).to.eql(fixture);
        return {
          code: function(statusCode) {
            expect(statusCode).to.eql(200);
            return {
              hold: function () {
                function Resp() {}
                Resp.prototype.send = function() {
                  expect(this.headers).to.be.an('object');
                  done();
                };
                return new Resp();
              }
            };
          }
        };
      });
    });

    it('should pass through the headers and add CORS headers', function (done) {
      var stream = Wreck.toReadableStream(JSON.stringify({ the: 'body' }));

      stream.headers = {
        some: 'header',
      };
      stream.statusCode = 200;
      pluginInternals.addCorsAndBearerToken(null, stream, {
        method: 'get',
        headers: { 'origin': 'some-origin', 'custom-header': 'add me to -Allowed-Headers' }
      }, function (data) {
        var fixture = '{"the":"body"}';
        expect(data.toString()).to.eql(fixture);
        return {
          code: function(statusCode) {
            expect(statusCode).to.eql(200);
            return {
              hold: function () {
                function Resp() {}
                Resp.prototype.send = function() {
                  expect(this.headers).to.eql({
                    some: 'header', 'content-length': 14,
                    'access-control-allow-origin': 'some-origin',
                    'access-control-allow-headers': 'authorization, content-length, content-type, if-match, if-none-match, origin, x-requested-with, custom-header',
                    'access-control-expose-headers': 'content-type, content-length, etag',
                    'access-control-allow-methods': 'GET, PUT, POST, DELETE',
                    'access-control-allow-credentials': 'true'
                  });
                  done();
                };
                return new Resp();
              }
            };
          }
        };
      });
    });

    it('should strip any set-cookie headers and add them into the body', function (done) {
      var payload = {
        the: 'body',
        bearerToken: 'some-token'
      };
      var fixture = '{"the":"body","bearerToken":"some-token"}';
      var stream = Wreck.toReadableStream(JSON.stringify(payload));

      stream.statusCode = 200;
      stream.headers = {
        some: 'header',
        'set-cookie': ['AuthSession=some-token; Version=bla bla bla']
      };

      pluginInternals.addCorsAndBearerToken(null, stream, { method: 'post', path:'/_api/_session', headers: {} }, function (data) {
        expect(data.toString()).to.eql(fixture);

        return {
          code: function(statusCode) {
            expect(statusCode).to.eql(200);
            return {
              hold: function () {
                function Resp() {}
                Resp.prototype.send = function() {
                  expect(this.headers['set-cookie']).to.be.an('undefined');
                };
                done();
                return new Resp();
              }
            };
          }
        };
      });
    });
  });
});

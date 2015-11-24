var Events = require('events')
var url = require('url')

var tap = require('tap')
var test = tap.test
var Wreck = require('wreck')

var plugin = require('../../lib/hapi/api')
var pluginInternals = require('../../lib/hapi/api/internals')

test('is a valid hapi plugin', function (t) {
  t.is(typeof plugin.register, 'function', 'register function')
  t.ok(plugin.register.attributes, 'attributes')
  t.end()
})

test('mapProxyPath', function (t) {
  t.plan(4)

  var couchCfg = url.parse('http://couch.somewhere:1234')

  t.test('should prepend the couchCfg url', function (tt) {
    tt.plan(1)

    pluginInternals.mapProxyPath(couchCfg, {
      headers: {},
      url: {
        path: '/hoodie/some/path'
      }
    }, function (arg1, url) {
      tt.is(url, 'http://couch.somewhere:1234/some/path')
    })
  })

  t.test('should pass the headers through', function (tt) {
    tt.plan(1)

    pluginInternals.mapProxyPath(couchCfg, {
      headers: {
        some: 'header'
      },
      url: {
        path: '/hoodie/some/path'
      }
    }, function (arg1, url, headers) {
      tt.is(headers.some, 'header')
    })
  })

  t.test('should strip any cookies', function (tt) {
    tt.plan(1)

    pluginInternals.mapProxyPath(couchCfg, {
      headers: {
        some: 'header',
        cookie: 'strip-me'
      },
      url: {
        path: '/hoodie/some/path'
      }
    }, function (arg1, url, headers) {
      tt.is(headers.cookie, undefined)
    })
  })

  t.test('should move any bearer token to the cookie', function (tt) {
    tt.plan(1)

    pluginInternals.mapProxyPath(couchCfg, {
      headers: {
        some: 'header',
        cookie: 'strip-me',
        authorization: 'Bearer my-token'
      },
      url: {
        path: '/hoodie/some/path'
      }
    }, function (arg1, url, headers) {
      tt.is(headers.cookie, 'AuthSession=my-token')
    })
  })
})

test('addCorseAndBearerToken', function (t) {
  t.plan(4)

  t.test('should return a 500 if there is an error', function (tt) {
    tt.plan(2)

    pluginInternals.addCorsAndBearerToken('something went wrong', {}, {}, function (err) {
      tt.is(err, 'something went wrong')
      return {
        code: function (statusCode) {
          tt.is(statusCode, 500)
        }
      }
    })
  })

  t.test('should return a 500 if wreck.read fails', function (tt) {
    tt.plan(2)

    var res = new Events.EventEmitter()
    res.pipe = function () {}

    pluginInternals.addCorsAndBearerToken(null, res, {headers: {}}, function (err) {
      tt.ok(err.isBoom)
      return {
        code: function (statusCode) {
          tt.is(statusCode, 500)
        }
      }
    })
    res.emit('error', new Error('my error'))
  })

  t.test('should call reply and hold', function (tt) {
    tt.plan(3)

    var stream = Wreck.toReadableStream('{"the":"body"}')
    stream.headers = {}
    stream.statusCode = 200

    pluginInternals.addCorsAndBearerToken(null, stream, { headers: {} }, function (data) {
      var fixture = '{"the":"body"}'
      tt.is(data.toString(), fixture)
      return {
        code: function (statusCode) {
          tt.is(statusCode, 200)
          return {
            hold: function () {
              function Resp () {}
              Resp.prototype.send = function () {
                tt.type(this.headers, 'object')
              }
              return new Resp()
            }
          }
        }
      }
    })
  })

  t.test('should strip any set-cookie headers and add them into the body', function (tt) {
    tt.plan(3)

    var payload = {
      the: 'body',
      bearerToken: 'some-token'
    }
    var fixture = '{"the":"body","bearerToken":"some-token"}'
    var stream = Wreck.toReadableStream(JSON.stringify(payload))

    stream.statusCode = 200
    stream.headers = {
      some: 'header',
      'set-cookie': ['AuthSession=some-token; Version=bla bla bla']
    }

    pluginInternals.addCorsAndBearerToken(null, stream, { method: 'post', path: '/hoodie/_session', headers: {} }, function (data) {
      tt.is(data.toString(), fixture)

      return {
        code: function (statusCode) {
          tt.is(statusCode, 200)
          return {
            hold: function () {
              function Resp () {}
              Resp.prototype.send = function () {
                tt.is(this.headers['set-cookie'], undefined)
              }
              return new Resp()
            }
          }
        }
      }
    })
  })
})

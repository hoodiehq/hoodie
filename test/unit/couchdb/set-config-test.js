var test = require('tap').test

test('set couch config', function (t) {
  t.test('request fails', function (tt) {
    var setConfig = require('../../../lib/couchdb.js').internals.setConfig

    tt.plan(2)

    setConfig(function (input, callback) {
      callback(new Error())
    }, function (err) {
      tt.ok(err instanceof Error)
    })

    setConfig(function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      tt.ok(err instanceof Error)
    })
  })

  t.test('request succeds', function (tt) {
    var setConfig = require('../../../lib/couchdb.js').internals.setConfig

    tt.plan(4)

    setConfig(function (input, callback) {
      tt.is(input.url, '/_config/httpd/authentication_handlers')
      tt.is(input.method, 'PUT')
      tt.is(input.body, '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}')
      callback(null)
    }, tt.error)
  })

  t.end()
})

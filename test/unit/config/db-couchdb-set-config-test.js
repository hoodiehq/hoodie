var test = require('tap').test

var setConfig = require('../../../server/config/db/couchdb-set-config.js')

test('set couch config', function (group) {
  group.test('request fails', function (t) {
    t.plan(2)

    setConfig(function (input, callback) {
      callback(new Error())
    }, function (err) {
      t.ok(err instanceof Error)
    })

    setConfig(function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      t.ok(err instanceof Error)
    })
  })

  group.test('request succeds', function (t) {
    t.plan(4)

    setConfig(function (input, callback) {
      t.is(input.url, '/_config/httpd/authentication_handlers')
      t.is(input.method, 'PUT')
      t.is(input.body, '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}')
      callback(null)
    }, t.error)
  })

  group.end()
})

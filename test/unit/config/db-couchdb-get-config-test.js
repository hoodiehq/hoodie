var test = require('tap').test

var getConfig = require('../../../lib/config/db/couchdb-get-config.js')

test('get couch config', function (t) {
  t.test('request fails', function (tt) {
    tt.plan(2)

    getConfig(function (input, callback) {
      callback(new Error())
    }, function (err) {
      tt.ok(err instanceof Error)
    })

    getConfig(function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      tt.ok(err instanceof Error)
    })
  })

  t.test('request succeds', function (tt) {
    tt.plan(9)

    getConfig(function (input, callback) {
      tt.is(input.url, '/_config/couch_httpd_auth')
      callback(null, null, {})
    }, function (err) {
      tt.ok(err instanceof Error)
    })

    getConfig(function (input, callback) {
      tt.is(input.url, '/_config/couch_httpd_auth')
      callback(null, null, {secret: 'foo'})
    }, function (err) {
      tt.ok(err instanceof Error)
    })

    getConfig(function (input, callback) {
      tt.is(input.url, '/_config/couch_httpd_auth')
      callback(null, null, {
        secret: 'foo',
        authentication_db: 'bar',
        ignore: 'baz'
      })
    }, function (err, result) {
      tt.error(err)

      tt.is(result.secret, 'foo')
      tt.is(result.authentication_db, 'bar')
      tt.notOk(result.ignore)
    })
  })

  t.end()
})

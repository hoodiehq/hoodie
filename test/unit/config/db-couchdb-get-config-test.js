var test = require('tap').test

var getConfig = require('../../../lib/config/db/couchdb-get-config.js')

test('get couch config', function (group) {
  group.test('request fails', function (t) {
    t.plan(2)

    getConfig(function (input, callback) {
      callback(new Error())
    }, function (err) {
      t.ok(err instanceof Error)
    })

    getConfig(function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      t.ok(err instanceof Error)
    })
  })

  group.test('request succeds', function (t) {
    t.plan(9)

    getConfig(function (input, callback) {
      t.is(input.url, '/_config/couch_httpd_auth')
      callback(null, null, {})
    }, function (err) {
      t.ok(err instanceof Error)
    })

    getConfig(function (input, callback) {
      t.is(input.url, '/_config/couch_httpd_auth')
      callback(null, null, {secret: 'foo'})
    }, function (err) {
      t.ok(err instanceof Error)
    })

    getConfig(function (input, callback) {
      t.is(input.url, '/_config/couch_httpd_auth')
      callback(null, null, {
        secret: 'foo',
        authentication_db: 'bar',
        ignore: 'baz'
      })
    }, function (err, result) {
      t.error(err)

      t.is(result.secret, 'foo')
      t.is(result.authentication_db, 'bar')
      t.notOk(result.ignore)
    })
  })

  group.end()
})

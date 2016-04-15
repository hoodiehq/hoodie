var test = require('tap').test

test('get couch admins', function (t) {
  t.test('request fails', function (tt) {
    var getAdmins = require('../../../lib/couchdb.js').getAdmins

    tt.plan(2)

    getAdmins(function (input, callback) {
      callback(new Error())
    }, function (err) {
      tt.ok(err instanceof Error)
    })

    getAdmins(function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      tt.ok(err instanceof Error)
    })
  })

  t.test('request succeds', function (tt) {
    var getAdmins = require('../../../lib/couchdb.js').getAdmins

    getAdmins(function (input, callback) {
      tt.is(input.url, '/_config/admins')
      callback(null, null, {
        user: 'secret'
      })
    }, function (err, admins) {
      tt.error(err)

      tt.is(admins.user, 'secret')
      tt.end()
    })
  })

  t.end()
})

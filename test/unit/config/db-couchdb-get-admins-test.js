var test = require('tap').test

var getAdmins = require('../../../server/config/db/couchdb-get-admins.js')

test('get couch admins', function (group) {
  group.test('request fails', function (t) {
    t.plan(2)

    getAdmins(function (input, callback) {
      callback(new Error())
    }, function (err) {
      t.ok(err instanceof Error)
    })

    getAdmins(function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      t.ok(err instanceof Error)
    })
  })

  group.test('request succeds', function (t) {
    getAdmins(function (input, callback) {
      t.is(input.url, '/_config/admins')
      callback(null, null, {
        user: 'secret'
      })
    }, function (err, admins) {
      t.error(err)

      t.is(admins.user, 'secret')
      t.end()
    })
  })

  group.end()
})

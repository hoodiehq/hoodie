/* eslint-disable handle-callback-err */
var url = require('url')

var async = require('async')
var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('db.grantPublicReadAccess / revokePublicReadAccess', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var couchdb = url.parse(DEFAULT_OPTIONS.base_url)
  delete couchdb.auth

  var db_url = url.format(couchdb) + 'foo/'

  var db_url_testuser1 = url.parse(db_url)
  db_url_testuser1.auth = 'user/testuser1:testing'
  db_url_testuser1 = url.format(db_url_testuser1)

  var db_url_testuser2 = url.parse(db_url)
  db_url_testuser2.auth = 'user/testuser2:testing'
  db_url_testuser2 = url.format(db_url_testuser2)

  hoodie.database.add('foo', function (err, db) {
    if (err) t.fail()
    var ignoreErrs = function (fn) {
      return function (callback) {
        fn(function () {
          var args = Array.prototype.slice.call(arguments, 1)
          return callback.apply(this, [null].concat(args))
        })
      }
    }
    var opt = {body: {asdf: 123}}
    var userdoc1 = {
      id: 'testuser1',
      password: 'testing'
    }
    var userdoc2 = {
      id: 'testuser2',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc1),
      async.apply(hoodie.account.add, 'user', userdoc2),
      async.apply(db.grantWriteAccess, 'user', 'testuser1'),
      db.grantPublicReadAccess,
      async.apply(request.get, db_url_testuser1 + '_all_docs'),
      async.apply(request.put, db_url_testuser1 + 'some_doc', opt),
      async.apply(request.get, db_url_testuser2 + '_all_docs'),
      async.apply(request.put, db_url_testuser2 + 'some_doc2', opt),
      async.apply(request.get, db_url + '_all_docs'),
      async.apply(request.put, db_url + 'some_doc3', opt),
      db.revokePublicReadAccess,
      async.apply(request.get, db_url_testuser1 + '_all_docs'),
      async.apply(request.put, db_url_testuser1 + 'some_doc4', opt),
      async.apply(request.get, db_url_testuser2 + '_all_docs'),
      async.apply(request.put, db_url_testuser2 + 'some_doc5', opt),
      async.apply(request.get, db_url + '_all_docs'),
      async.apply(request.put, db_url + 'some_doc6', opt)
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      t.equal(results[4][0].statusCode, 200) // testuser1 read
      t.equal(results[5][0].statusCode, 201) // testuser1 write
      t.equal(results[6][0].statusCode, 200) // testuser2 read
      t.equal(results[7][0].statusCode, 401) // testuser2 write
      t.equal(results[8][0].statusCode, 200) // anonyous read
      t.equal(results[9][0].statusCode, 401) // anonymous write
      // after revoke - testuser1 retains original permisisons
      t.equal(results[11][0].statusCode, 200) // testuser1 read
      t.equal(results[12][0].statusCode, 201) // testuser1 write
      t.equal(results[13][0].statusCode, 401) // testuser2 read
      t.equal(results[14][0].statusCode, 401) // testuesr2 write
      t.equal(results[15][0].statusCode, 401) // anonymous read
      t.equal(results[16][0].statusCode, 401) // anonymous write
      t.end()
    })
  })
})

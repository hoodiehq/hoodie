/* eslint-disable handle-callback-err */
var url = require('url')

var async = require('async')
var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')

require('../lib/setup-teardown')(tap)

test('db.grantReadAccess / revokeReadAccess for specific users', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var couchdb = url.parse(DEFAULT_OPTIONS.base_url)
  delete couchdb.auth

  var db_url = url.parse(url.format(couchdb) + 'foo/')
  db_url.auth = 'user/testuser:testing'
  db_url = url.format(db_url)

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
    var userdoc = {
      id: 'testuser',
      password: 'testing'
    }
    var tasks = [
      async.apply(hoodie.account.add, 'user', userdoc),
      async.apply(request.get, db_url + '_all_docs'),
      async.apply(db.grantReadAccess, 'user', 'testuser'),
      async.apply(request.get, db_url + '_all_docs'),
      async.apply(request.put, db_url + 'some_doc', {body: {asdf: 123}}),
      async.apply(db.revokeReadAccess, 'user', 'testuser'),
      async.apply(request.get, db_url + '_all_docs'),
      async.apply(request.put, db_url + 'some_doc2', {body: {asdf: 123}})
    ]
    async.series(tasks.map(ignoreErrs), function (err, results) {
      t.equal(results[1][0].statusCode, 401)
      t.equal(results[3][0].statusCode, 200)
      t.equal(results[4][0].statusCode, 401)
      // after revoke
      t.equal(results[6][0].statusCode, 401)
      t.equal(results[7][0].statusCode, 401)
      t.end()
    })
  })
})

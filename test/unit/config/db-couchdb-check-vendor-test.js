var log = require('npmlog')
var test = require('tap').test

test('check couch vendor', function (t) {
  t.test('request fails', function (tt) {
    var checkVendor = require('../../../lib/config/db/couchdb.js').internals.checkVendor

    tt.plan(2)

    checkVendor({db: {url: '<% COUCH URL %>'}}, function (input, callback) {
      callback(new Error())
    }, function (err) {
      tt.match(err.message, '<% COUCH URL %>')
    })

    checkVendor({db: {url: '<% COUCH URL %>'}}, function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      tt.match(err.message, '<% COUCH URL %>')
    })
  })

  t.test('verify vendor', function (tt) {
    var checkVendor = require('../../../lib/config/db/couchdb.js').internals.checkVendor
    tt.plan(3)

    checkVendor({}, function (input, callback) {
      callback(null, null, {
        couchdb: 'Welcome!'
      })
    }, tt.error)

    var tmp = log.warn
    log.warn = function (scope, message) {
      log.warn = tmp
      tt.match(message, '<% VENDOR %>')
    }
    checkVendor({}, function (input, callback) {
      callback(null, null, {
        '<% VENDOR %>': 'Welcome!'
      })
    }, tt.error)
  })

  t.end()
})

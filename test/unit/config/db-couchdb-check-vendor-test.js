var log = require('npmlog')
var test = require('tap').test

var checkVendor = require('../../../lib/config/db/couchdb-check-vendor.js')

test('check couch vendor', function (group) {
  group.test('request fails', function (t) {
    t.plan(2)

    checkVendor({db: {url: '<% COUCH URL %>'}}, function (input, callback) {
      callback(new Error())
    }, function (err) {
      t.match(err.message, '<% COUCH URL %>')
    })

    checkVendor({db: {url: '<% COUCH URL %>'}}, function (input, callback) {
      callback(null, {statusCode: 500})
    }, function (err) {
      t.match(err.message, '<% COUCH URL %>')
    })
  })

  group.test('verify vendor', function (t) {
    t.plan(3)

    checkVendor({}, function (input, callback) {
      callback(null, null, {
        couchdb: 'Welcome!'
      })
    }, t.error)

    var tmp = log.warn
    log.warn = function (scope, message) {
      log.warn = tmp
      t.match(message, '<% VENDOR %>')
    }
    checkVendor({}, function (input, callback) {
      callback(null, null, {
        '<% VENDOR %>': 'Welcome!'
      })
    }, t.error)
  })

  group.end()
})

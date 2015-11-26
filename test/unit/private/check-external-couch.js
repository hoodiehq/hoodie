var nock = require('nock')
var proxyquire = require('proxyquire')
var test = require('tap').test
require('npmlog').level = 'silent'

var checkExternalDatabase = require('../../../lib').checkExternalDatabase

test('check external database', function (t) {
  t.test('no external db', function (tt) {
    checkExternalDatabase({db: {}}, function (err) {
      tt.error(err, 'no verification')
      tt.end()
    })
  })

  t.test('db available', function (tt) {
    nock('http://example.com')
    .get('/')
    .reply(200, {
      Welcome: 'couchdb'
    })

    checkExternalDatabase({db: {url: 'http://example.com/'}}, function (err) {
      tt.error(err, 'does not complain')
      tt.end()
    })
  })

  t.test('db unavailable', function (tt) {
    checkExternalDatabase({db: {url: 'malformedurl'}}, function (err) {
      tt.ok(err, 'returns error')
      tt.end()
    })
  })

  t.test('db misconfigured', function (tt) {
    nock('http://example.com')
    .get('/')
    .reply(500)

    checkExternalDatabase({db: {url: 'http://example.com/'}}, function (err) {
      tt.ok(err, 'returns error')
      tt.end()
    })
  })

  t.test('unofficial couch distribution', function (tt) {
    tt.plan(1)

    nock('http://example.com')
    .get('/')
    .reply(200, {
      Welcome: 'not-couchdb'
    })

    proxyquire('../../../lib', {
      npmlog: {
        info: function () {},
        silly: function () {},
        warn: function () {
          tt.ok(true, 'warns about unofficial distribution')
        },
        '@noCallThru': true
      }
    }).checkExternalDatabase({db: {url: 'http://example.com/'}}, function () {})
  })

  t.test('pouchdb-express distribution', function (tt) {
    tt.plan(1)

    nock('http://example.com')
    .get('/')
    .reply(200, {
      Welcome: 'not-couchdb'
    })

    proxyquire('../../../lib', {
      npmlog: {
        info: function () {},
        silly: function () {},
        warn: function () {
          tt.ok(true, 'warns about unofficial distribution')
        },
        '@noCallThru': true
      }
    }).checkExternalDatabase({db: {url: 'http://example.com/'}}, function () {})
  })

  t.end()
})

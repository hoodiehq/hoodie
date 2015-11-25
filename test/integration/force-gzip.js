var url = require('url')
var zlib = require('zlib')

var bl = require('bl')
var request = require('request')
var tap = require('tap')
var test = tap.test

var startServerTest = require('./lib/start-server-test')

startServerTest(test, 'handle forced gzip', function (t, env_config, end) {
  t.test('should receive gzip when gzip accept header sent', function (tt) {
    tt.plan(4)
    request.get(url.format(env_config.app) + '/hoodie', {
      headers: {'Accept-Encoding': 'gzip, deflate'}
    })
    .on('response', function (res) {
      tt.is(res.headers['content-encoding'], 'gzip')
    })
    .pipe(bl(function (error, data) {
      tt.error(error)
      zlib.gunzip(data, function (error, udat) {
        tt.error(error)
        tt.ok(/hoodie/.test(udat.toString()))
      })
    }))
  })
  t.test('should receive no gzip when no gzip accept header sent', function (tt) {
    request.get(url.format(env_config.app) + '/hoodie')
    .on('response', function (res) {
      tt.notOk(res.headers['content-encoding'])
      tt.end()
    })
  })
  t.test('should receive gzip when no gzip accept header sent but force query param', function (tt) {
    tt.plan(4)
    request.get(url.format(env_config.app) + '/hoodie?force_gzip=true')
    .on('response', function (res) {
      tt.is(res.headers['content-encoding'], 'gzip')
    })
    .pipe(bl(function (error, data) {
      tt.error(error)
      zlib.gunzip(data, function (error, udat) {
        tt.error(error)
        tt.ok(/hoodie/.test(udat.toString()))
      })
    }))
  })
  t.test('teardown', end)
})

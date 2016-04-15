var url = require('url')
var zlib = require('zlib')

var test = require('tap').test

var hoodieServer = require('../../')
var mockCouchDB = require('./utils/mock-couchdb')

test('handle forced gzip', function (t) {
  t.test('receive gzip when gzip accept header sent', function (tt) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      tt.error(err, 'hoodie-server loads without error')

      server.inject({
        url: url.resolve(url.format(config.app), 'hoodie'),
        headers: {'Accept-Encoding': 'gzip, deflate'}
      }, testGzip.bind(null, tt, server))
    })
  })

  t.test('receive no gzip when no gzip accept header sent', function (tt) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      tt.error(err, 'hoodie-server loads without error')

      server.inject({url: url.resolve(url.format(config.app), 'hoodie')}, function (res) {
        tt.notOk(res.headers['content-encoding'])
        server.stop(tt.end)
      })
    })
  })

  t.test('receive gzip when gzip accept header sent', function (tt) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      tt.error(err, 'hoodie-server loads without error')

      server.inject({
        url: url.resolve(url.format(config.app), 'hoodie?force_gzip=true')
      }, testGzip.bind(null, tt, server))
    })
  })

  t.end()
})

function testGzip (tt, server, res) {
  tt.is(res.headers['content-encoding'], 'gzip', 'content is gzip encoded')

  zlib.gunzip(res.rawPayload, function (error, udat) {
    tt.error(error, 'gunzips without error')
    tt.ok(/hoodie/.test(udat.toString()), 'correct content')
    server.stop(tt.end)
  })
}

var url = require('url')
var zlib = require('zlib')

var test = require('tap').test

var hoodieServer = require('../../')
var mockCouchDB = require('./utils/mock-couchdb')

test('handle forced gzip', function (group) {
  group.test('receive gzip when gzip accept header sent', function (t) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      t.error(err, 'hoodie loads without error')

      server.inject({
        url: url.resolve(url.format(config.app), 'hoodie'),
        headers: {'Accept-Encoding': 'gzip, deflate'}
      }, testGzip.bind(null, t, server))
    })
  })

  group.test('receive no gzip when no gzip accept header sent', function (t) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      t.error(err, 'hoodie loads without error')

      server.inject({url: url.resolve(url.format(config.app), 'hoodie')}, function (res) {
        t.notOk(res.headers['content-encoding'])
        server.stop(t.end)
      })
    })
  })

  group.test('receive gzip when gzip accept header sent', function (t) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      t.error(err, 'hoodie loads without error')

      server.inject({
        url: url.resolve(url.format(config.app), 'hoodie?force_gzip=true')
      }, testGzip.bind(null, t, server))
    })
  })

  group.end()
})

function testGzip (t, server, res) {
  t.is(res.headers['content-encoding'], 'gzip', 'content is gzip encoded')

  zlib.gunzip(res.rawPayload, function (error, udat) {
    t.error(error, 'gunzips without error')
    t.ok(/hoodie/.test(udat.toString()), 'correct content')
    server.stop(t.end)
  })
}

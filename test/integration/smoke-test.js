var url = require('url')

var request = require('request')
var test = require('tap').test

var hoodieServer = require('../../')
var mockCouchDB = require('./utils/mock-couchdb')

test('smoke test', function (t) {
  mockCouchDB()

  hoodieServer({
    inMemory: true,
    loglevel: 'error',
    dbUrl: 'http://admin:secret@localhost:5984'
  }, function (err, server, config) {
    t.error(err, 'hoodie-server loads without error')

    server.start(function (err) {
      t.error(err, 'hoodie-server starts without error')
      request({
        url: url.resolve(url.format(config.app), 'hoodie'),
        json: true
      }, function (err, res, data) {
        t.error(err, 'no error on request')
        t.is(res.statusCode, 200, 'status 200')
        t.ok(data.hoodie, 'is hoodie')

        server.stop(t.end)
      })
    })
  })
})

var url = require('url')

var request = require('request')
var test = require('tap').test

var hoodieServer = require('../../')
var mockCouchDB = require('./utils/mock-couchdb')

test('smoke test', function (group) {
  mockCouchDB()

  hoodieServer({
    inMemory: true,
    loglevel: 'error',
    dbUrl: 'http://admin:secret@localhost:5984'
  }, function (err, server, config) {
    group.error(err, 'hoodie loads without error')

    server.start(function (err) {
      group.error(err, 'hoodie starts without error')
      request({
        url: url.resolve(url.format(config.app), 'hoodie'),
        json: true
      }, function (err, res, data) {
        group.error(err, 'no error on request')
        group.is(res.statusCode, 200, 'status 200')
        group.ok(data.hoodie, 'is hoodie')

        server.stop(group.end)
      })
    })
  })
})

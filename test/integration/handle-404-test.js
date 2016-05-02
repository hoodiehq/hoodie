var url = require('url')

var test = require('tap').test

var hoodieServer = require('../../')
var mockCouchDB = require('./utils/mock-couchdb')

test('forward all requests that accept html to app', function (group) {
  group.test('send index.html on accept: text/html', function (t) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      t.error(err, 'hoodie loads without error')

      server.inject({
        url: url.resolve(url.format(config.app), 'does_not_exist'),
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, function (res) {
        t.is(res.statusCode, 200, 'statusCode is 200')
        t.match(res.payload, /<html/, 'response is HTML')
        server.stop(t.end)
      })
    })
  })

  group.test('send a JSON 404 on anything but accept: text/html*', function (t) {
    mockCouchDB()

    hoodieServer({
      inMemory: true,
      loglevel: 'error',
      dbUrl: 'http://admin:secret@localhost:5984'
    }, function (err, server, config) {
      t.error(err)

      server.inject({
        url: url.resolve(url.format(config.app), 'does_not_exist'),
        headers: {
          accept: 'application/json'
        }
      }, function (res) {
        t.is(res.statusCode, 404, 'statusCode is 404')
        t.is(res.result.error, 'Not Found', 'Not Found error')
        server.stop(t.end)
      })
    })
  })

  group.end()
})

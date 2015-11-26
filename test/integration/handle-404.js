var url = require('url')

var test = require('tap').test

var hoodieServer = require('../../')

test('forward all requests that accept html to app', function (t) {
  t.test('send index.html on accept: text/html', function (tt) {
    hoodieServer({
      inMemory: true,
      loglevel: 'error'
    }, function (err, server, config) {
      tt.error(err, 'hoodie-server loads without error')

      server.inject({
        url: url.resolve(url.format(config.app), 'does_not_exist'),
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, function (res) {
        tt.is(res.statusCode, 200, 'statusCode is 200')
        tt.match(res.payload, /<html/, 'response is HTML')
        server.stop(tt.end)
      })
    })
  })

  t.test('send a JSON 404 on anything but accept: text/html*', function (tt) {
    hoodieServer({
      inMemory: true,
      loglevel: 'error'
    }, function (err, server, config) {
      tt.error(err)

      server.inject({
        url: url.resolve(url.format(config.app), 'does_not_exist'),
        headers: {
          accept: 'application/json'
        }
      }, function (res) {
        tt.is(res.statusCode, 404, 'statusCode is 404')
        tt.is(res.result.error, 'Not Found', 'Not Found error')
        server.stop(tt.end)
      })
    })
  })

  t.end()
})

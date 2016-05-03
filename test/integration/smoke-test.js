var url = require('url')

var request = require('request')
var test = require('tap').test

var hoodieServer = require('../../')

test('smoke test', function (group) {
  hoodieServer({
    inMemory: true,
    loglevel: 'error'
  }, function (err, server, config) {
    group.error(err, 'hoodie loads without error')

    server.start(function (err) {
      group.error(err, 'hoodie starts without error')

      request({
        url: 'http:' + url.resolve(url.format(config.server.connection) + ':' + config.server.connection.port, 'hoodie'),
        json: true
      }, function (error, res, data) {
        group.error(error, 'no error on request')

        group.is(res.statusCode, 200, 'status 200')
        group.ok(data.hoodie, 'is hoodie')

        server.stop(group.end)
      })
    })
  })
})

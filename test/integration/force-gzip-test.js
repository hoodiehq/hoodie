var url = require('url')
var zlib = require('zlib')

var test = require('tap').test

var hoodieServer = require('../../')

test('handle forced gzip', function (group) {
  group.test('receive gzip when gzip accept header sent', function (group) {
    hoodieServer({
      inMemory: true,
      loglevel: 'error'
    }, function (err, server, config) {
      group.error(err, 'hoodie loads without error')

      server.inject({
        url: url.resolve(toUrl(config.connection), 'hoodie'),
        headers: {'Accept-Encoding': 'gzip, deflate'}
      }, testGzip.bind(null, group, server))
    })
  })

  group.test('receive no gzip when no gzip accept header sent', function (group) {
    hoodieServer({
      inMemory: true,
      loglevel: 'error'
    }, function (err, server, config) {
      group.error(err, 'hoodie loads without error')

      server.inject({url: url.resolve(toUrl(config.connection), 'hoodie')}, function (res) {
        group.notOk(res.headers['content-encoding'])
        server.stop(group.end)
      })
    })
  })

  group.test('receive gzip when gzip accept header sent', function (group) {
    hoodieServer({
      inMemory: true,
      loglevel: 'error'
    }, function (err, server, config) {
      group.error(err, 'hoodie loads without error')

      server.inject({
        url: url.resolve(toUrl(config.connection), 'hoodie?force_gzip=true')
      }, testGzip.bind(null, group, server))
    })
  })

  group.end()
})

function testGzip (group, server, res) {
  group.is(res.headers['content-encoding'], 'gzip', 'content is gzip encoded')

  zlib.gunzip(res.rawPayload, function (error, udat) {
    group.error(error, 'gunzips without error')
    group.ok(/hoodie/.test(udat.toString()), 'correct content')
    server.stop(group.end)
  })
}

function toUrl (connection) {
  return url.format({
    protocol: 'http',
    hostname: connection.host,
    port: connection.port
  })
}

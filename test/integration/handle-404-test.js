var Hapi = require('hapi')
var test = require('tap').test

var hoodie = require('../../').register
var hapiPluginOptions = {
  register: hoodie,
  options: {
    inMemory: true,
    loglevel: 'error',
    paths: {}
  }
}

require('npmlog').level = 'error'

test('forward all requests that accept html to app', function (group) {
  group.test('send index.html on accept: text/html', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/does_not_exist',
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }, function (response) {
        t.is(response.statusCode, 200, 'statusCode is 200')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send a JSON 404 on anything but accept: text/html*', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/does_not_exist',
        headers: {
          accept: 'application/json'
        }
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.is(response.result.error, 'Not Found', 'Not Found error')

        server.stop(t.end)
      })
    })
  })

  group.test('send a 404 on a unknown /hoodie-request', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unkown',
        headers: {
          accept: 'text/html'
        }
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.is(response.result.error, 'Not Found', 'Not Found error')

        server.stop(t.end)
      })
    })
  })

  group.end()
})


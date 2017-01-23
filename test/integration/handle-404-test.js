var Hapi = require('hapi')
var test = require('tap').test
var PouchDB = require('pouchdb-core')
  .plugin(require('pouchdb-mapreduce'))
  .plugin(require('pouchdb-adapter-memory'))

var hoodie = require('../../').register
var hapiPluginOptions = {
  register: hoodie,
  options: {
    inMemory: true,
    loglevel: 'error',
    paths: {},
    PouchDB: PouchDB
  }
}

require('npmlog').level = 'error'

test('forward requests to app', function (group) {
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

  group.test('send a JSON 404 on accept: application/json', function (t) {
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
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.end()
})

test('forward all hoodie requests to hoodie', function (group) {
  group.test('send index.html on unknown /hoodie/ request', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/does_not_exist',
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

  group.end()
})

test('forward all requests that have resource filetypes in the hoodie URL to 404.html', function (group) {
  group.test('send 404.html on unknown /hoodie/ request (CSS)', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.css'
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send 404.html on unknown /hoodie/ request (JS)', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.js'
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send 404.html on unknown /hoodie/ request (PNG)', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.png'
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send 404.html on unknown /hoodie/ request (JPG)', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.jpg'
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.end()
})

test('forward all hoodie requests that accept anything but html to 404.html', function (group) {
  group.test('send 404.html on accept: text/css', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.html',
        headers: {
          accept: 'text/css'
        }
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send 404.html on accept: application/javascript', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.html',
        headers: {
          accept: 'application/javascript'
        }
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send 404.html on accept: image/png', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.html',
        headers: {
          accept: 'image/png'
        }
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.test('send 404.html on accept: image/jpeg', function (t) {
    var server = new Hapi.Server()
    server.connection({port: 8090})
    server.register(hapiPluginOptions, function (error) {
      t.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/unknown.html',
        headers: {
          accept: 'image/jpeg'
        }
      }, function (response) {
        t.is(response.statusCode, 404, 'statusCode is 404')
        t.match(response.payload, /<html/, 'response is HTML')

        server.stop(t.end)
      })
    })
  })

  group.end()
})

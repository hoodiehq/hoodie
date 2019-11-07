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
    PouchDB: PouchDB,
    plugins: [],
    app: {}
  }
}

require('npmlog').level = 'error'

test('/does_not_exist with accept: text/html', function (t) {
  var server = new Hapi.Server()
  server.connection({ port: 8090 })
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

test('/does_not_exist.css with accept: text/css', function (t) {
  var server = new Hapi.Server()
  server.connection({ port: 8090 })
  server.register(hapiPluginOptions, function (error) {
    t.error(error, 'hoodie loads without error')

    server.inject({
      url: 'http://localhost:8090/does_not_exist.css',
      headers: {
        accept: 'text/css,*/*;q=0.1'
      }
    }, function (response) {
      t.is(response.statusCode, 404, 'statusCode is 404')

      server.stop(t.end)
    })
  })
})

test('/hoodie/admin/login with accept: text/html', function (t) {
  var server = new Hapi.Server()
  server.connection({ port: 8090 })
  server.register(hapiPluginOptions, function (error) {
    t.error(error, 'hoodie loads without error')

    server.inject({
      url: 'http://localhost:8090/hoodie/admin/login',
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

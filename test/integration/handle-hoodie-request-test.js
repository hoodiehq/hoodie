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

test('respond to all /hoodie/* - requests with an index.html', function (group) {
  var server

  group.beforeEach(function (done) {
    server = new Hapi.Server()
    server.connection({ port: 8090 })
    server.register(hapiPluginOptions, function () {
      done()
    })
  })

  group.afterEach(function (done) {
    server.stop(done)
  })

  group.test('respond to /admin/', function (t) {
    checkRequestForPath(t, '/hoodie/admin/')
  })

  group.test('repond to /account/', function (t) {
    checkRequestForPath(t, '/hoodie/account/')
  })

  group.test('respond to /store/', function (t) {
    checkRequestForPath(t, '/hoodie/store/')
  })

  group.test('respond to /hoodie/unkown', function (t) {
    server.inject({
      url: 'http://localhost:8090/hoodie/unkown',
      headers: {
        accept: 'text/html'
      }
    }, function (response) {
      t.is(response.statusCode, 404, 'statusCode is 404')

      server.stop(t.end)
    })
  })

  function checkRequestForPath (t, path) {
    server.inject({
      url: 'http://localhost:8090' + path,
      headers: {
        accept: 'text/html'
      }
    }, function (response) {
      t.is(response.statusCode, 200, 'statusCode is 200')
      t.match(response.payload, /<html/, 'response is HTML')

      t.end()
    })
  }

  group.end()
})

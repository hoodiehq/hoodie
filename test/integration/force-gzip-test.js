var zlib = require('zlib')

var Hapi = require('hapi')
var test = require('tap').test
var PouchDB = require('pouchdb-core')
  .plugin(require('pouchdb-mapreduce'))
  .plugin(require('pouchdb-adapter-memory'))

var hoodie = require('../../').register
var hapiOptions = {
  debug: {
    request: ['error'],
    log: ['error']
  }
}
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

test('handle forced gzip', function (group) {
  group.test('receive gzip when gzip accept header sent', function (group) {
    var server = new Hapi.Server(hapiOptions)
    server.connection({ port: 8090 })
    server.register(hapiPluginOptions, function (error) {
      group.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/info.json',
        headers: { 'Accept-Encoding': 'gzip, deflate' }
      }, testGzip.bind(null, group, server))
    })
  })

  group.test('receive no gzip when no gzip accept header sent', function (group) {
    var server = new Hapi.Server(hapiOptions)
    server.connection({ port: 8090 })
    server.register(hapiPluginOptions, function (error) {
      group.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/info.json'
      }, function (response) {
        group.notOk(response.headers['content-encoding'])
        server.stop(group.end)
      })
    })
  })

  group.test('receive gzip when gzip accept header sent', function (group) {
    var server = new Hapi.Server(hapiOptions)
    server.connection({ port: 8090 })
    server.register(hapiPluginOptions, function (error) {
      group.error(error, 'hoodie loads without error')

      server.inject({
        url: 'http://localhost:8090/hoodie/info.json?force_gzip=true'
      }, testGzip.bind(null, group, server))
    })
  })

  group.end()
})

function testGzip (group, server, response) {
  group.is(response.headers['content-encoding'], 'gzip', 'content is gzip encoded')

  zlib.gunzip(response.rawPayload, function (error, udat) {
    group.error(error, 'gunzips without error')
    group.ok(/hoodie/.test(udat.toString()), 'correct content')
    server.stop(group.end)
  })
}

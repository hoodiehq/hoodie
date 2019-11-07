var Hapi = require('hapi')
var request = require('request')
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

test('smoke test', function (t) {
  var server = new Hapi.Server(hapiOptions)
  server.connection({ port: 8090 })

  server.register(hapiPluginOptions, function (error) {
    t.error(error, 'loads hoodie plugin without error')

    server.start(function (error) {
      t.error(error, 'hoodie starts without error')

      request({
        url: 'http://localhost:8090/hoodie/info.json',
        json: true
      }, function (error, response, data) {
        t.error(error, 'no error on request')

        t.is(response.statusCode, 200, 'status 200')
        t.ok(data.hoodie, 'is hoodie')

        server.stop(t.end)
      })
    })
  })
})

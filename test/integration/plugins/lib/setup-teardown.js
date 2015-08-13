var async = require('async')
var request = require('request').defaults({json: true})
var spawnPouchdbServer = require('spawn-pouchdb-server')

var DEFAULT_OPTIONS = require('./default-options')
var COUCH = DEFAULT_OPTIONS.couchdb

module.exports = function (tap) {
  tap.test('setup', function (tt) {
    tt.test('pouchdb', function (t) {
      spawnPouchdbServer({
        backend: false,
        config: {
          file: false,
          log: {
            file: false
          },
          httpd: {
            port: 5985
          }
        }
      }, function (error, pouch) {
        t.error(error)
        t.end()
      })
    })

    tt.test('database', function (t) {
      var appconfig = {
        config: {
          foo: 'bar',
          email_host: 'emailhost',
          email_port: 465,
          email_user: 'gmail.user@gmail.com',
          email_pass: 'userpass',
          email_secure: true,
          email_service: 'Gmail'
        }
      }
      async.series([
        async.apply(request.put, COUCH.url + '_config/admins/' + COUCH.user, {body: COUCH.pass}),
        async.apply(request.put, DEFAULT_OPTIONS.base_url + 'plugins'),
        async.apply(request.put, DEFAULT_OPTIONS.base_url + 'app'),
        async.apply(request.put, DEFAULT_OPTIONS.base_url + 'app/config', {body: appconfig})
      ],
      function (error, results) {
        t.error(error)
        t.end()
        tt.end()
      })
    })
  })

  tap.tearDown(process.exit)
}

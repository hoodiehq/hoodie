var url = require('url')

var async = require('async')
var request = require('request').defaults({json: true})
var spawnPouchdbServer = require('spawn-pouchdb-server')

var DEFAULT_OPTIONS = require('./default-options')

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
      var couchdb = url.parse(DEFAULT_OPTIONS.base_url)
      var auth = couchdb.auth.split(':')
      delete couchdb.auth
      async.series([
        async.apply(request.put, url.format(couchdb) + '_config/admins/' + auth[0], {body: auth[1]}),
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

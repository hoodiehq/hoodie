var test = require('tap').test
var proxyquire = require('proxyquire')

test('generate couch config', function (t) {
  t.test('read from file', function (tt) {
    var pouchDbConfig = proxyquire('../../../lib/config/db/pouchdb.js', {
      fs: {
        existsSync: function () {
          return true
        },
        '@noCallThru': true
      },
      jsonfile: {
        readFileSync: function () {
          return {
            couch_httpd_auth_secret: 'a'
          }
        },
        '@noCallThru': true
      }
    })

    pouchDbConfig({
      config: {
        db: {},
        paths: {
          data: ''
        }
      }
    }, function (error, result) {
      tt.error(error)
      tt.is(result.db.secret, 'a')
      tt.is(result.db.authenticationDb, '_users')
      tt.end()
    })
  })

  t.test('generate and write to file', function (tt) {
    var pouchDbConfig = proxyquire('../../../lib/config/db/pouchdb.js', {
      fs: {
        existsSync: function () {
          return false
        },
        '@noCallThru': true
      },
      jsonfile: {
        writeFileSync: function () {},
        '@noCallThru': true
      }
    })

    pouchDbConfig({
      config: {
        db: {},
        paths: {
          data: ''
        }
      }
    }, function (error, result) {
      tt.error(error)
      tt.is(result.db.secret.length, 32)
      tt.is(result.db.authenticationDb, '_users')
      tt.end()
    })
  })

  t.end()
})

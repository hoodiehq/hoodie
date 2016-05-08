var test = require('tap').test
var proxyquire = require('proxyquire')

test('generate couch config', function (group) {
  group.test('read from file', function (t) {
    var pouchDbConfig = proxyquire('../../../server/config/db/pouchdb.js', {
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
      t.error(error)
      t.is(result.db.secret, 'a')
      t.is(result.db.authenticationDb, '_users')
      t.end()
    })
  })

  group.test('generate and write to file', function (t) {
    var pouchDbConfig = proxyquire('../../../server/config/db/pouchdb.js', {
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
      t.error(error)
      t.is(result.db.secret.length, 32)
      t.is(result.db.authenticationDb, '_users')
      t.end()
    })
  })

  group.end()
})

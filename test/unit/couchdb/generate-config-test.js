var test = require('tap').test
var proxyquire = require('proxyquire')

test('generate couch config', function (t) {
  t.test('read from file', function (tt) {
    var generatedConfig = proxyquire('../../../lib/couchdb.js', {
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
    }).internals.generatedConfig

    var result = generatedConfig({paths: {data: ''}})

    tt.is(result.secret, 'a')
    tt.is(result.authentication_db, '_users')

    tt.end()
  })

  t.test('generate and write to file', function (tt) {
    var generatedConfig = proxyquire('../../../lib/couchdb.js', {
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
    }).internals.generatedConfig

    var result = generatedConfig({paths: {data: ''}})

    tt.is(result.secret.length, 32)
    tt.is(result.authentication_db, '_users')

    tt.end()
  })

  t.end()
})

var nock = require('nock')
var test = require('tap').test

nock('http://127.0.0.1:5984')
  .get('/')
  .reply(200, {couchdb: 'Welcome'})

  .put('/_config/httpd/authentication_handlers')
  .reply(200)

  .get('/_config/couch_httpd_auth')
  .reply(200, {
    secret: 'foo',
    authentication_db: '_users'
  })

  .get('/_config/admins')
  .reply(200, {
    user: 'secret'
  })

test('init couchdb', function (t) {
  var couchdb = require('../../../lib/config/db/couchdb')

  couchdb({
    config: {
      db: {
        url: 'http://a:b@127.0.0.1:5984/'
      }
    }
  }, function (err, result) {
    t.error(err)

    t.is(result.db.secret, 'foo')
    t.is(result.db.authenticationDb, '_users')
    t.same(result.db.admins, {
      user: 'secret'
    })

    t.end()
  })
})

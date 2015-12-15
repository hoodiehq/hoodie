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

test('init couchdb', function (t) {
  var couchdb = require('../../lib/couchdb')

  couchdb({db: {url: 'http://a:b@127.0.0.1:5984/'}}, function (err, result) {
    t.error(err)

    t.is(result.secret, 'foo')
    t.is(result.authentication_db, '_users')

    t.end()
  })
})

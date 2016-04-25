module.exports = mockCouchDB

var nock = require('nock')

function mockCouchDB () {
  nock('http://localhost:5984')
    .get('/')
    .reply(200, {})

    .put('/_config/httpd/authentication_handlers')
    .reply(200, '')

    .get('/_config/couch_httpd_auth')
    .reply(200, {
      allow_persistent_cookies: 'true',
      auth_cache_size: '50',
      authentication_db: '_users',
      secret: '78875068a1979fb910d5d8f37d316aa4',
      require_valid_user: 'false',
      authentication_redirect: '/_utils/session.html',
      timeout: '1209600',
      iterations: '10'
    })

    .get('/_config/admins')
    .reply(200, {
      admin: '-pbkdf2-3fd7fd3bcf39016f7635517d7dd9624db75826b4,ad5357330b59351ceddcc75ca4e266c3,10'
    })

    .get('/_users/')
    .reply(200, {
      db_name: '_users',
      doc_count: 20,
      doc_del_count: 7,
      update_seq: 709,
      purge_seq: 0,
      compact_running: false,
      disk_size: 2826347,
      data_size: 32287,
      instance_start_time: '1450189831378012',
      disk_format_version: 6,
      committed_update_seq: 709
    })

    .post('/_users/_bulk_docs', function (body) {
      return body.new_edits && body.docs.length === 1 && body.docs[0]._id === '_design/byId'
    })
    .reply(201, [{
      ok: true,
      id: '_design/byId',
      rev: '1-35356499b92d202e37d4b84efb5f3515'
    }])
}

var test = require('tap').test
require('npmlog').level = 'silent'

var removeAuth = require('../../server/utils/remove-auth-from-url')
var userDatabases = require('../../server/utils/user-databases')

test('utils', function (group) {
  group.test('removeAuth', function (t) {
    t.is(removeAuth('http://foo:secret@example.com:1234'), 'http://example.com:1234', 'removes username & password from url')
    t.is(removeAuth('http://example.com'), 'http://example.com', 'returns same URL if no username or password passed')

    t.end()
  })

  group.test('user-databases.remove', function (t) {
    var config = {}
    config.db = {}
    config.db.url = false
    userDatabases.remove(config, {}, {})

    t.end()
  })

  group.end()
})

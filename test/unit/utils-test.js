var test = require('tap').test
require('npmlog').level = 'silent'

var removeAuth = require('../../server/utils/remove-auth-from-url')

test('utils', function (group) {
  group.test('removeAuth', function (group) {
    group.is(removeAuth('http://foo:secret@example.com:1234'), 'http://example.com:1234', 'removes username & password from url')
    group.is(removeAuth('http://example.com'), 'http://example.com', 'returns same URL if no username or password passed')

    group.end()
  })

  group.end()
})

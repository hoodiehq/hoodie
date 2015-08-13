var tap = require('tap')
var test = tap.test

require('../lib/setup-teardown')(tap)

test('accounts.prepareDoc', function (t) {
  var doc = {
    '_rev': '1-3d269028677df88e4e200b0740fa7971',
    'name': 'user/wobble',
    'type': 'user',
    'roles': [],
    'ownerHash': '1msc4g0',
    'database': 'user/1msc4g0',
    'updatedAt': '2013-08-02T13:11:36.646Z',
    'createdAt': '2013-08-02T13:11:36.646Z',
    'signedUpAt': '2013-08-02T13:11:36.646Z',
    'password_sha': '32010a749794347f10b1aea407db8c4230e7f27b',
    'salt': '90b42421db5d65d4126e7a6ce641840e',
    'id': 'wobble'
  }
  t.same(require('../../../../lib/plugins/api/accounts').prepareDoc(doc), {
    '_id': 'org.couchdb.user:user/wobble',
    '_rev': '1-3d269028677df88e4e200b0740fa7971',
    'name': 'user/wobble',
    'type': 'user',
    'roles': [],
    'ownerHash': '1msc4g0',
    'database': 'user/1msc4g0',
    'updatedAt': '2013-08-02T13:11:36.646Z',
    'createdAt': '2013-08-02T13:11:36.646Z',
    'signedUpAt': '2013-08-02T13:11:36.646Z',
    'password_sha': '32010a749794347f10b1aea407db8c4230e7f27b',
    'salt': '90b42421db5d65d4126e7a6ce641840e'
  })
  t.end()
})

var proxyquire = require('proxyquire')
var simple = require('simple-mock')
var test = require('tap').test

var pouchdbUsersStub = {
  '@noCallThru': true
}
var accountConfig = proxyquire('../../../lib/config/account', {
  'pouchdb-users': pouchdbUsersStub
})

test('account config', function (t) {
  var installUsersBehaviorStub = simple.stub().resolveWith()
  var pluginStub = simple.stub()
  var dbStub = {
    installUsersBehavior: installUsersBehaviorStub,
    constructor: {
      plugin: pluginStub
    }
  }
  var getDatabaseStub = simple.stub().returnWith(dbStub)
  accountConfig({
    getDatabase: getDatabaseStub,
    config: {
      account: {},
      db: {
        admins: 'db admins',
        secret: 'db secret'
      }
    }
  }, function (error, config) {
    t.error(error)

    t.is(pluginStub.lastCall.arg, pouchdbUsersStub, 'installs pouchdb-users')
    t.is(installUsersBehaviorStub.callCount, 1, 'installs user behavior')
    t.is(config.account.admins, 'db admins', 'sets config.account.admins')
    t.is(config.account.secret, 'db secret', 'sets config.account.secret')
    t.same(config.account.usersDb, dbStub, 'sets config.account.usersDb')

    t.end()
  })
})

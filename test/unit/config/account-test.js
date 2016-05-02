var proxyquire = require('proxyquire')
var simple = require('simple-mock')
var test = require('tap').test

var pouchdbUsersStub = {
  '@noCallThru': true
}
var accountConfig = proxyquire('../../../lib/config/account', {
  'pouchdb-users': pouchdbUsersStub
})

test('account config', function (group) {
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
    group.error(error)

    group.is(pluginStub.lastCall.arg, pouchdbUsersStub, 'installs pouchdb-users')
    group.is(installUsersBehaviorStub.callCount, 1, 'installs user behavior')
    group.is(config.account.admins, 'db admins', 'sets config.account.admins')
    group.is(config.account.secret, 'db secret', 'sets config.account.secret')
    group.same(config.account.usersDb, dbStub, 'sets config.account.usersDb')

    group.end()
  })
})

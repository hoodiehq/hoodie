var proxyquire = require('proxyquire')
var simple = require('simple-mock')
var test = require('tap').test

var BoomStub = {
  '@noCallThru': true
}
var preAuthHook = proxyquire('../../../server/config/store/pre-auth-hook', {
  'boom': BoomStub
})

test('store pre auth hook', function (group) {
  var session = {
    session: {
      id: 'session123'
    },
    account: {
      id: 'user123'
    }
  }
  var findSessionStub = simple.stub().returnWith({ // don’group use resolveWith to avoid async
    then: function (callback) {
      callback(session)
      return {
        catch: function () {}
      }
    }
  })
  var serverStub = {
    plugins: {
      account: {
        api: {
          sessions: {
            find: findSessionStub
          }
        }
      }
    }
  }
  var request = {
    path: 'user123',
    headers: {
      authorization: 'session session123'
    },
    connection: {
      server: serverStub
    }
  }
  var reply = {
    continue: simple.stub()
  }

  preAuthHook(request, reply)

  group.is(reply.continue.callCount, 1, 'reply.continue() called')

  group.end()
})

var async = require('async')
var tap = require('tap')
var test = tap.test

var OPTS = require('../lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

require('../lib/setup-teardown')(tap)

test('trigger account events in plugins', function (t) {
  pluginsManager.start(OPTS, function (error, manager) {
    if (error) throw error
    var hoodie = manager.createAPI({name: 'myplugin'})

    var evs = []
    function pushEv (name) {
      return function (doc) {
        if (doc._deleted) {
          evs.push(name + ' deleted')
        } else {
          evs.push(name + ' ' + doc.name)
        }
      }
    }
    function recEvent (name) {
      hoodie.account.on(name, pushEv(name))
    }
    recEvent('change')
    recEvent('user:change')
    recEvent('other:change')

    var doc = {id: 'foo', password: 'secret'}
    async.series([
      async.apply(hoodie.account.add, 'user', doc),
      async.apply(hoodie.account.update, 'user', 'foo', {asdf: 123}),
      async.apply(hoodie.account.remove, 'user', 'foo')
    ],
      function (error) {
        if (error) throw error
        setTimeout(function () {
          t.same(evs, [
            'change user/foo',
            'user:change user/foo',
            'change user/foo',
            'user:change user/foo',
            'change deleted',
            'user:change deleted'
          ])
          manager.stop(function (error) {
            t.error(error)
            t.end()
          })
        }, 200)
      })
  })
})

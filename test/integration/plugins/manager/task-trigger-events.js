var async = require('async')
var tap = require('tap')
var test = tap.test

var OPTS = require('../lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

require('../lib/setup-teardown')(tap)

test('trigger task events in plugins', function (t) {
  pluginsManager.start(OPTS, function (error, manager) {
    if (error) throw error
    var hoodie = manager.createAPI({name: 'myplugin'})

    var tasklist = []
    function recEvent (name) {
      hoodie.task.on(name, function (db, doc) {
        if (doc._deleted) {
          tasklist.push(name + ' deleted')
        } else {
          tasklist.push(name + ' ' + doc.name)
        }
      })
    }
    recEvent('change')
    recEvent('mytask:change')
    recEvent('other:change')

    hoodie.database.add('user/foo', function (error) {
      if (error) throw error
      hoodie.task.addSource('user/foo')
      var doc = {id: 'asdf', name: 'test'}
      var db = hoodie.database('user/foo')
      async.series([
        async.apply(db.add, '$mytask', doc),
        async.apply(db.add, 'notatask', doc),
        async.apply(db.update, '$mytask', 'asdf', {foo: 'bar'}),
        async.apply(db.remove, '$mytask', 'asdf')
      ],
      function (error, results) {
        if (error) throw error
        // give it time to return in _changes feed
        setTimeout(function () {
          t.same(tasklist, [
            'change test',
            'mytask:change test',
            'change test',
            'mytask:change test',
            'change deleted',
            'mytask:change deleted'
          ])
          // task events should no longer fire from this db
          hoodie.task.removeSource('user/foo')
          tasklist = []
          db.add('$othertask', doc, function () {
            // give it time to return in _changes feed
            setTimeout(function () {
              t.same(tasklist, [])
              manager.stop(function (error) {
                t.error(error)
                t.end()
              })
            }, 200)
          })
        }, 2000)
      })
    })
  })
})

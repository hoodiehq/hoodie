var async = require('async')
var tap = require('tap')
var test = tap.test

var OPTS = require('../lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

require('../lib/setup-teardown')(tap)

test('get config values from plugin manager', function (t) {
  t.plan(10)
  pluginsManager.start(OPTS.couch_url, function (error, manager) {
    if (error) throw error
    var add_calls = 0
    var hoodie = manager.createAPI({name: 'myplugin'})
    hoodie.task.on('add', function (dbname, task) {
      add_calls++
      t.is(dbname, 'testdb')
      t.is(task.type, '$email')
      t.is(task.from, 'from')
      t.is(task.to, 'to')
    })
    hoodie.task.on('email:add', function (dbname, task) {
      t.is(dbname, 'testdb')
      t.is(task.type, '$email')
      t.is(task.from, 'from')
      t.is(task.to, 'to')

      hoodie.task.success(dbname, task, function (error) {
        if (error) throw error
        // give events from the finish call time to fire
        t.is(add_calls, 1)
        setTimeout(function () {
          manager.stop(function (error) {
            t.error(error)
            t.end()
          })
        }, 200)
      })
    })
    hoodie.database.add('testdb', function (error, db) {
      if (error) throw error
      async.series([
        async.apply(hoodie.task.addSource, 'testdb'),
        async.apply(hoodie.task.addSource, 'testdb'),
        async.apply(hoodie.task.addSource, 'testdb')
      ], function (error) {
        if (error) throw error
        db.add('$email', {to: 'to', from: 'from'}, function (error) {
          if (error) throw error
        })
      })
    })
  })
})

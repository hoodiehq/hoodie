var test = require('tap').test

var OPTS = require('./lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

test('get config values from plugin manager', function (t) {
  t.plan(9)
  pluginsManager.start(OPTS, function (error, manager) {
    if (error) throw error
    var hoodie = manager.createAPI({name: 'myplugin'})
    hoodie.task.on('add', function (dbname, task) {
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
        setTimeout(function () {
          manager.stop(function (error) {
            t.error(error)
            t.end()
            process.exit()
          })
        }, 200)
      })
    })
    hoodie.database.add('testdb', function (error, db) {
      if (error) throw error
      hoodie.task.addSource('testdb')
      db.add('$email', {to: 'to', from: 'from'}, function (error) {
        if (error) throw error
      })
    })
  })
})

var async = require('async')
var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var OPTS = require('./lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

function postDoc (url, doc, cb) {
  request.post(url, {body: doc}, cb)
}

test('unprocessed tasks should be handled on addSource', function (t) {
  var dburl = OPTS.base_url + '/testdb2'
  request.put(dburl, {body: {name: 'testdb2'}}, function (error, res) {
    if (error) throw error
    t.is(res.statusCode, 201, 'HTTP status code')
    var names = ['foo', 'bar', 'baz']
    async.map(names, function (name, cb) {
      var doc = {
        _id: '$example/' + name,
        type: '$example',
        name: name
      }
      postDoc(dburl, doc, cb)
    },
      function (error) {
        if (error) throw error
        async.parallel([
          function (cb) {
            // add a processed doc
            postDoc(dburl, {
              _id: '$example/qux',
              type: '$example',
              name: 'qux',
              $processedAt: 'now',
              _deleted: true
            }, cb)
          },
          function (cb) {
            // add a processed doc
            postDoc(dburl, {
              _id: '$example/quux',
              type: '$example',
              name: 'quux',
              $error: 'stuff broke'
            }, cb)
          }
        ],
          function (error) {
            if (error) throw error
            pluginsManager.start(OPTS, function (error, manager) {
              if (error) throw error
              var hoodie = manager.createAPI({name: 'myplugin'})
              hoodie.task.addSource('testdb2')
              var added_tasks = []
              var changed_tasks = []
              hoodie.task.on('example:add', function (db, task) {
                added_tasks.push(task.name)
              })
              hoodie.task.on('example:change', function (db, task) {
                changed_tasks.push(task.name)
              })
              setTimeout(function () {
                t.same(added_tasks.sort(), ['bar', 'baz', 'foo'])
                t.same(changed_tasks.sort(), [
                  'bar', 'baz', 'foo', 'quux', 'qux'
                ])
                manager.stop(function (error) {
                  t.error(error)
                  t.end()
                  process.exit()
                })
              }, 10000)
            })
          })
      })
  })
})

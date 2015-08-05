var request = require('request')
var test = require('tap').test

var OPTS = require('./lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

test('automatically update app config', function (t) {
  pluginsManager.start(OPTS, function (error, manager) {
    if (error) throw error
    var hoodie = manager.createAPI({name: 'myplugin'})

    t.is(hoodie.config.get('foo'), 'bar')

    var url = hoodie._resolve('app/config')
    setTimeout(function () {
      request.get(url, function (error, res, data) {
        if (error) throw error
        var doc = JSON.parse(data)
        doc.config.foo = 'wibble'
        request.put(url, {body: JSON.stringify(doc)}, function (error) {
          if (error) throw error
          // test that couchdb change event causes config to update
          setTimeout(function () {
            t.is(hoodie.config.get('foo'), 'wibble')
            manager.stop(function (error) {
              t.error(error)
              t.end()
              process.exit()
            })
          }, 200)
        })
      })
    }, 200)
  })
})

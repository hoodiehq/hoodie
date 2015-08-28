var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var OPTS = require('../lib/default-options')
var pluginsManager = require('../../../../lib/plugins/manager')

require('../lib/setup-teardown')(tap)

test('automatically update plugin config', function (t) {
  pluginsManager.start(OPTS.couch_url, function (error, manager) {
    if (error) throw error
    var hoodie = manager.createAPI({name: 'myplugin'})

    t.is(hoodie.config.get('foo'), 'bar')

    var url = hoodie._resolve('plugins/plugin%2Fmyplugin')
    var doc = {config: {foo: 'wibble2'}}
    setTimeout(function () {
      request.put(url, {body: doc}, function (error, res) {
        if (error) throw error
        t.is(res.statusCode, 201, 'HTTP status code')
        // test that couchdb change event causes config to update
        setTimeout(function () {
          t.is(hoodie.config.get('foo'), 'wibble2')
          manager.stop(function (error) {
            t.error(error)
            t.end()
          })
        }, 200)
      })
    }, 200)
  })
})

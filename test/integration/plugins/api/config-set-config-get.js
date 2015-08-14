var request = require('request').defaults({json: true})
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('../lib/default-options')
var COUCH = DEFAULT_OPTIONS.couchdb

require('../lib/setup-teardown')(tap)

test('config.set / config.get', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var hoodie2 = new PluginAPI({
    name: 'otherplugin',
    couchdb: COUCH,
    config: DEFAULT_OPTIONS.config
  })

  // try getting a property that does not exist
  t.strictEqual(hoodie.config.get('asdf'), undefined)

  // set then immediately read a property
  hoodie.config.set('asdf', 123)
  t.equal(hoodie.config.get('asdf'), 123)

  // read global config
  t.equal(hoodie.config.get('foo'), 'bar')

  // override global config value for single plugin only
  hoodie.config.set('foo', 'baz')
  t.equal(hoodie.config.get('foo'), 'baz')
  t.equal(hoodie2.config.get('foo'), 'bar')

  // make sure the config is persistent
  setTimeout(function () {
    var myplugin_url = hoodie._resolve('plugins/plugin%2Fmyplugin')
    var otherplugin_url = hoodie._resolve('plugins/plugin%2Fotherplugin')

    request.get(myplugin_url, function (err, res, doc) {
      if (err) t.fail()

      t.equal(doc.config.foo, 'baz')
      request.get(otherplugin_url, function (er, res) {
        t.same(res.statusCode, 404)
        t.end()
      })
    })
  }, 1000)
})

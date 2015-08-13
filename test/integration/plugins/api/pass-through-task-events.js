var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('pass through task events', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var evs = []
  hoodie.task.on('change', function (doc) {
    evs.push('change ' + doc.name)
  })
  hoodie.task.emit('change', {name: 'test'})
  t.same(evs, [
    'change test'
  ])
  t.end()
})

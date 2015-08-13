var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('pass through user events from plugin manager', function (t) {
  var hoodie = new PluginAPI(DEFAULT_OPTIONS)
  var account_events = []
  hoodie.account.on('change', function (doc) {
    account_events.push('change ' + doc.name)
  })
  hoodie.account.emit('change', {name: 'testuser'})
  t.same(account_events, [
    'change testuser'
  ])
  t.end()
})

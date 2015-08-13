var _ = require('lodash')
var tap = require('tap')
var test = tap.test

var PluginAPI = require('../../../../lib/plugins/api').PluginAPI

var DEFAULT_OPTIONS = require('./lib/default-options')

require('./lib/setup-teardown')(tap)

test('pass subscribe and unsubscribe calls to manager', function (t) {
  var sources = []
  var hoodie = new PluginAPI(_.extend(DEFAULT_OPTIONS, {
    addSource: function (name) {
      sources.push(name)
    },
    removeSource: function (name) {
      sources = _.filter(sources, function (n) {
        return n !== name
      })
    }
  }))
  t.same(sources, [])
  hoodie.task.addSource('foo')
  t.same(sources, ['foo'])
  hoodie.task.addSource('bar')
  t.same(sources, ['foo', 'bar'])
  hoodie.task.removeSource('bar')
  t.same(sources, ['foo'])
  hoodie.task.removeSource('foo')
  t.same(sources, [])
  t.end()
})

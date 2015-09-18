var EventEmitter = require('events').EventEmitter

var _ = require('lodash')
var async = require('async')
var log = require('npmlog')

var exports = module.exports = function (plugins) {
  var emitter = new EventEmitter()
  emitter.emit = function () {
    var eargs = Array.prototype.slice.call(arguments)
    var event = eargs.shift()
    if (!event) return false
    var types = event.split(':')
    if (types.length > 1) {
      var plugin = plugins[types[0]]
      if (!plugin) return false
      plugin.hooks.dynamic.emit.apply(plugin.hooks.dynamic, [
        event.substr(types[0].length)
      ].concat(eargs))
      return true
    }
    var fns = _.compact(
      _.flatten(
        _.pluck(
          _.values(plugins),
          'hooks.dynamic._events.' + event
        )
      )
      .concat(emitter._events[event] || [])
    )

    if (fns.length === 0) return false

    var done = function () {}
    if (typeof _.last(eargs) === 'function') {
      done = eargs.pop()
    }

    async.applyEachSeries.apply(null, [fns].concat(eargs).concat(done))
    return true
  }
  return emitter
}

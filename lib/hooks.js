var EventEmitter = require('events').EventEmitter

var _ = require('lodash')
var async = require('async')
var log = require('npmlog')

var exports = module.exports = function (plugins) {
  var emitter = new EventEmitter()

  function getFnsArgs (eargs) {
    eargs = Array.prototype.slice.call(eargs)
    var event = eargs.shift()
    if (!event) return false
    var fns = _.compact(
      _.flatten(
        _.pluck(
          _.values(plugins),
          'hooks.dynamic._events.' + event
        )
      )
      .concat(emitter._events[event])
    )

    if (fns.length === 0) return false

    var done = function () {}
    if (typeof _.last(eargs) === 'function') {
      done = eargs.pop()
    }
    return [fns, eargs, done]
  }

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
    // default to series
    return emitter.series.emit.apply(null, arguments)
  }

  emitter.every = {
    emit: function () {
      var fnargs = getFnsArgs(arguments)
      if (!fnargs) return false
      async.every(fnargs[0], function (fn, cb) {
        fn.apply(null, fnargs[1].concat(cb))
      }, fnargs[2])
      return true
    }
  }

  emitter.series = {
    emit: function () {
      var fnargs = getFnsArgs(arguments)
      if (!fnargs) return false
      async.applyEachSeries.apply(null, [fnargs[0]].concat(fnargs[1]).concat(fnargs[2]))
      return true
    }
  }

  return emitter
}

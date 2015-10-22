var EventEmitter = require('events').EventEmitter

var _ = require('lodash')
var async = require('async')
var log = require('npmlog')

module.exports = function (plugins) {
  var emitter = new EventEmitter()

  emitter.emit = function (event) {
    var eventArgs = Array.prototype.slice.call(arguments, 1)

    if (!event) return false

    var types = event.split(':')

    // default to series
    if (types.length === 1) return emitter.series.emit.apply(null, arguments)

    var pluginName = types.shift()
    var plugin = plugins[pluginName]

    if (!plugin) return false

    log.verbose('hooks', 'Sending hook to plugin %s: %s', pluginName, event)

    plugin.hooks.dynamic.emit.apply(
      plugin.hooks.dynamic,
      [event.substr(pluginName.length)].concat(eventArgs)
    )

    return true
  }

  _.set(emitter, 'every.emit', _.flow(
    _.curry(getArgs)(emitter, plugins),
    _.spread(function (functions, eventArgs, done) {
      if (!functions) return false

      async.every(functions, function (fn, cb) {
        fn.apply(null, eventArgs.concat(cb))
      }, done)

      return true
    })
  ))

  _.set(emitter, 'series.emit', _.flow(
    _.curry(getArgs)(emitter, plugins),
    _.spread(function (functions, eventArgs, done) {
      if (!functions) return false

      async.applyEachSeries.apply(null, [functions].concat(eventArgs, done))

      return true
    })
  ))

  return emitter
}

function getArgs (emitter, plugins, event) {
  var eventArgs = Array.prototype.slice.call(arguments, 3)

  if (!event) return false

  var functions = _(plugins)
  .values()
  .pluck('hooks.dynamic._events.' + event)
  .flatten()
  .concat(emitter._events[event])
  .compact()
  .value()

  if (!functions.length) return false

  log.verbose('hooks', 'Sending global hook: %s', event)
  return [functions, eventArgs, _.isFunction(_.last(eventArgs))
    ? eventArgs.pop()
    : function () {}
  ]
}

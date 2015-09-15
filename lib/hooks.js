var EventEmitter = require('events').EventEmitter

var _ = require('lodash')
var async = require('async')
var log = require('npmlog')

var exports = module.exports = function (env_config) {
  var emitter = new EventEmitter()
  var _emit = emitter.emit
  emitter.emit = function (event) {
    var eargs = arguments
    _emit.apply(this, eargs)
    var types = event.split(':')
    if (types.length > 1) {
      var plugin = env_config.plugins[types[0]]
      if (!plugin) return false
      plugin.hooks.dynamic.emit.apply(plugin.hooks.dynamic, [
        event.substr(types[0].length + 1)
      ].concat(Array.prototype.slice.call(eargs, 1)))
    } else {
      _.forIn(env_config.plugins, function (plugin) {
        plugin.hooks.dynamic.emit.apply(plugin.hooks.dynamic, eargs)
      })
    }
    return true
  }
  return emitter
}

var _ = require('lodash')
var async = require('async')

var log = require('./log')

var exports = module.exports = function (env_config) {
  return {
    runStatic: exports.run.bind(null, env_config, 'static'),
    runDynamic: exports.run.bind(null, env_config, 'dynamic'),
    runDynamicForPlugin: exports.runForPlugin.bind(null, env_config, 'dynamic'),
    runStaticAsyncEvery: exports.runAsyncEvery.bind(null, env_config, 'static'),
    runDynamicAsyncEvery: exports.runAsyncEvery.bind(null, env_config, 'dynamic')
  }
}

exports.getHooksFromPlugins = function (env_config, type, name, args) {
  return _.compact(_.map(env_config.plugins, function (plugin) {
    if (plugin.hooks[type] && typeof plugin.hooks[type][name] === 'function') {
      return Function.prototype.bind.apply(
        plugin.hooks[type][name],
        [env_config].concat(args || [])
      )
    }
  }))
}

// runs a hook for all registered plugins
exports.run = function (env_config, type, name, args) {
  log.verbose('hooks', 'Running %s hook %s', type, name)

  var hooks = exports.getHooksFromPlugins(type, name, args)
  hooks.forEach(function (hook) {
    hook()
  })

  return !!hooks.length
}

// runs hook for a specific plugin
exports.runForPlugin = function (env_config, type, plugin, name, args) {
  plugin = 'hoodie-plugin-' + plugin
  if (env_config.plugins[plugin] && env_config.plugins[plugin].hooks[type][name]) {
    return env_config.plugins[plugin].hooks[type][name].apply(env_config, args)
  }
  return false
}

exports.runAsyncEvery = function (env_config, type, name, args, callback) {
  var runHook = function (hook, cb) {
    hook(cb)
  }

  // go through all plugins and fetch hook `name`
  // execute all hooks `name` in `async.every`, passing args + callback
  var hooks = exports.getHooksFromPlugins(type, name, args)
  async.every(hooks, runHook, callback)
}

var EventEmitter = require('events').EventEmitter
var path = require('path')
var url = require('url')

var async = require('async')
var log = require('npmlog')

var loadModule = require('./load-module')
var plugins_manager = require('./manager')

var exports = module.exports = function (env_config, callback) {
  log.verbose('plugins', 'Starting all plugins')

  plugins_manager.start(url.format(env_config.db), function (err, manager) {
    if (err) {
      return callback(err)
    }

    // loop through plugins and start
    var plugins = Object.keys(env_config.plugins)

    async.map(plugins, function (name, cb) {
      var hoodie = manager.createAPI({name: name})
      hoodie._name = name
      hoodie.hooks = new EventEmitter()
      return exports.startPlugin(name, env_config, hoodie, cb)
    }, function (err) {
      if (err) {
        return callback(err)
      }
      if (plugins.length) log.info('plugins', 'All plugins started')
      callback()
    })
  })
}

exports.startPlugin = function (name, env_config, hoodie, callback) {
  log.info('plugins', 'Starting plugin ' + name)

  hoodie.env = env_config

  async.applyEachSeries([
    doStartPlugin,
    doInitHooks
  ], env_config.plugins[name].path, callback)

  function doStartPlugin (pluginPath, cb) {
    var serverModule = loadModule(path.join(pluginPath, 'server'))
    if (!serverModule) {
      log.silly('plugins', 'No server module found for ' + name)
      return cb()
    }
    log.silly('plugins', 'Server module found for ' + name)
    return serverModule(hoodie, cb)
  }

  function doInitHooks (pluginPath, cb) {
    var dynamicHook = loadModule(path.join(pluginPath, 'hooks', 'dynamic'))
    if (!dynamicHook) {
      log.silly('plugins', 'No dynamic hook found for ' + name)
      return cb()
    }
    log.silly('plugins', 'Dynamic hook found for ' + name)
    env_config.plugins[name].hooks.dynamic = hoodie.hooks
    dynamicHook(hoodie, cb)
  }
}

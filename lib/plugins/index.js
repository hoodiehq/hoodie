var EventEmitter = require('events').EventEmitter
var fs = require('fs')
var path = require('path')
var url = require('url')

var _ = require('lodash')
var async = require('async')
var log = require('npmlog')

var plugins_manager = require('./manager')

exports.load = function (env_config, callback) {
  log.silly('plugins', 'Reading project\'s package.json for plugins')
  if (!env_config.plugins.length) {
    log.info('plugins', 'Nothing found in package.json')
    return callback(null, env_config)
  }

  env_config.plugins = env_config.plugins

  .map(function (plugin) {
    return exports.resolvePluginPath(env_config.paths.project, plugin)
  })

  .reduce(function (acc, p) {
    var pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json')))
    acc[pkg.name] = {
      path: p,
      pkg: pkg,
      hooks: {
        static: exports.loadModule(path.join(p, 'hooks', 'static')),
        hapi: exports.loadModule(path.join(p, 'hooks', 'hapi'))
      }
    }
    if (acc[pkg.name].hooks.hapi) {
      acc[pkg.name].hooks.hapi.attributes = acc[pkg.name].hooks.hapi.attributes || {}
      acc[pkg.name].hooks.hapi.attributes.name = pkg.name
    }
    return acc
  }, {})
  callback(null, env_config)
}

exports.startAll = function (env_config, callback) {
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

  var doStartPlugin = function (p, cb) {
    var serverModule = exports.loadModule(path.join(p, 'server'))
    if (!serverModule) {
      log.silly('plugins', 'No server module found for ' + name)
      return cb()
    }
    log.silly('plugins', 'Server module found for ' + name)
    return serverModule(hoodie, cb)
  }

  var doInitHooks = function (p, cb) {
    var dynamicHook = exports.loadModule(path.join(p, 'hooks', 'dynamic'))
    if (!dynamicHook) {
      log.silly('plugins', 'No dynamic hook found for ' + name)
      return cb()
    }
    log.silly('plugins', 'Dynamic hook found for ' + name)
    env_config.plugins[name].hooks.dynamic = hoodie.hooks
    dynamicHook(hoodie, cb)
  }

  async.applyEachSeries([
    doStartPlugin,
    doInitHooks
  ], env_config.plugins[name].path, callback)
}

exports.loadModule = function (p) {
  try {
    var mod = require(p)
    return typeof mod === 'function' ? mod : null
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
    return null
  }
}

exports.resolvePluginPath = function (projectDir, plugin) {
  var errorMessage = 'Plugin not found: ' + plugin

  // module lookup
  if (plugin[0] !== '.' && plugin[0] !== '/') {
    try {
      return path.dirname(require.resolve(path.join(plugin, 'package.json')))
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw new Error(errorMessage)
      }

      // hoodie-server might be `npm link`ed. Let's retry in the cwd.
      try {
        return path.dirname(require.resolve(path.join(
          projectDir,
          'node_modules',
          plugin,
          'package.json'
        )))
      } catch (e) {
        throw new Error(errorMessage)
      }
    }
  }

  // relative or absolute path
  var dir = path.resolve(projectDir, plugin)
  try {
    if (fs.statSync(dir).isDirectory()) {
      return dir
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e
    }
  }
  throw new Error(errorMessage)
}

var fs = require('fs')
var path = require('path')
var url = require('url')

var async = require('async')
var log = require('npmlog')

var plugins_manager = require('./manager')

exports.load = function (env_config, callback) {
  log.silly('plugins', 'Reading project\'s package.json for plugins')
  if (!env_config.plugins.length) {
    log.info('plugins', 'Nothing found in package.json')
  }

  env_config.plugins = env_config.plugins

  .map(function (plugin) {
    return exports.resolvePluginPath(env_config, plugin)
  })

  .reduce(function (acc, p) {
    var meta = JSON.parse(fs.readFileSync(path.resolve(p, 'package.json')))
    var hooks = exports.readPluginHooks(p)
    acc[meta.name] = {path: p, metadata: meta, hooks: {'static': hooks}}
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

  var doStartPlugin = function (hoodie, p, cb) {
    if (exports.hasWorker(p)) {
      var wmodule = require(p)
      return wmodule(hoodie, cb)
    }

    return cb()
  }

  var doInitHooks = function (hoodie, p, cb) {
    var hooksPath = path.resolve(p, 'hooks', 'dynamic.js')
    if (exports.hasHooks(hooksPath)) {
      var hmodule = require(hooksPath)
      env_config.plugins[name].hooks.dynamic = hmodule(hoodie, cb)
    }

    return cb()
  }

  hoodie.env = env_config

  async.applyEachSeries([
    doStartPlugin,
    doInitHooks
  ], hoodie, env_config.plugins[name].path, callback)
}

exports.hasWorker = function (path) {
  try {
    require.resolve(path)
    log.silly('plugins', 'Worker found at ' + path)
    return true
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      log.silly('plugins', 'No worker found at ' + path)
      return false
    } else {
      throw e
    }
  }
}

exports.hasHooks = function (path) {
  var exists = fs.existsSync(path)
  log.silly(
    'plugins', exists
      ? 'Hook found at ' + path
      : 'No hook found at ' + path
  )
  return exists
}

exports.resolvePluginPath = function (env_config, plugin) {
  var errorMessage = 'Plugin not found: ' + plugin

  // module lookup
  if (!(plugin[0] === '.' || plugin[0] === '/')) {
    try {
      return path.dirname(require.resolve(path.join(plugin, 'package.json')))
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw new Error(errorMessage)
      }

      // hoodie-server might be `npm link`ed. Let's retry in the cwd.
      try {
        return path.dirname(require.resolve(path.join(
          env_config.paths.project,
          'node_modules',
          plugin,
          'package.json'
        )))
      } catch(e) {
        throw new Error(errorMessage)
      }
    }
  }

  // relative or absolute path
  var dir = path.resolve(env_config.paths.project, plugin)
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

exports.readPluginHooks = function (p) {
  try {
    return require(path.resolve(p, 'hooks', 'static.js'))
  } catch (e) {
    // ignore non-existent hooks/static.js
    return {}
  }
}

var fs = require('fs')
var path = require('path')

var async = require('async')

var credentials = require('../couchdb/utils').credentials
var log = require('../log')
var plugins_manager = require('../plugins/manager')

exports.load = function (env_config, callback) {
  log.silly('Reading project\'s package.json for plugins')

  env_config.plugins = exports.readPlugins(env_config)
  callback(null, env_config)
}

exports.startAll = function (env_config, callback) {
  log.verbose('Starting all plugins')

  var couchdb = credentials.get(env_config.hoodie.data_path)

  plugins_manager.start({couchdb: {
    url: env_config.couch.url,
    user: couchdb.username,
    pass: couchdb.password
  }}, function (err, manager) {
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
      if (plugins.length) log.info('All plugins started')
      callback()
    })
  })
}

exports.startPlugin = function (name, env_config, hoodie, callback) {
  log.info('Starting plugin ' + name)

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
    log.silly('Worker found at ' + path)
    return true
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      log.silly('No worker found at ' + path)
      return false
    } else {
      throw e
    }
  }
}

exports.hasHooks = function (path) {
  var exists = fs.existsSync(path)
  log.silly(exists ?
    'Hook found at ' + path :
    'No hook found at ' + path
  )
  return exists
}

exports.readPlugins = function (env_config) {
  var paths = exports.getPluginPaths(env_config)

  return paths.reduce(function (acc, p) {
    var meta = exports.readPluginMetadata(p)
    var hooks = exports.readPluginHooks(p)
    acc[meta.name] = {path: p, metadata: meta, hooks: {'static': hooks}}
    return acc
  }, {})
}

exports.isDirectory = function (p) {
  try {
    return fs.statSync(p).isDirectory()
  } catch (e) {
    if (e.code === 'ENOENT') {
      // not found
      return false
    }
    throw e
  }
}

exports.resolvePluginPath = function (env_config, p) {
  var errorMessage = 'Plugin not found: ' + p

  // module lookup
  if (!(p[0] === '.' || p[0] === '/')) {
    try {
      return path.dirname(require.resolve(path.join(p, 'package.json')))
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') {
        throw new Error(errorMessage)
      }

      // hoodie-server might be `npm link`ed. Let's retry in the cwd.
      try {
        return path.dirname(require.resolve(path.join(
          env_config.project_dir,
          'node_modules',
          p,
          'package.json'
        )))
      } catch(e) {
        throw new Error(errorMessage)
      }
    }
  }

  // relative or absolute path
  var dir = path.resolve(env_config.project_dir, p)
  if (exports.isDirectory(dir)) {
    return dir
  }
  throw new Error(errorMessage)
}

exports.getPluginPaths = function (env_config) {
  var app = env_config.app

  app.hoodie = app.hoodie || {}

  if (!app.hoodie.plugins) {
    app.hoodie.plugins = []
    log.info('No plugins found in package.json')
  }

  return app.hoodie.plugins.map(function (p) {
    return exports.resolvePluginPath(env_config, p)
  })
}

exports.readPluginHooks = function (p) {
  try {
    var hooks_file = path.resolve(p, 'hooks', 'static.js')
    return require(hooks_file)
  } catch (e) {
    // ignore non-existent hooks/static.js
    return {}
  }
}

exports.readPluginMetadata = function (p) {
  var data = fs.readFileSync(path.resolve(p, 'package.json'))
  return JSON.parse(data)
}

exports.getPluginNames = function (env_config) {
  return Object.keys(env_config.plugins).map(function (id) {
    return id.replace(/^hoodie-plugin-/, '')
  })
}

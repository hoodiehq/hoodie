var fs = require('fs')
var path = require('path')

var _ = require('lodash')
var log = require('npmlog')

var loadModule = require('./load-module')

var exports = module.exports = function (plugins, projectPath) {
  log.silly('plugins', 'Reading project\'s package.json for plugins')
  if (!plugins.length) {
    log.info('plugins', 'Nothing found in package.json')
    return {}
  }

  return _(plugins)
  .map(function (plugin) {
    var pluginPath = exports.resolvePluginPath(projectPath, plugin)
    var pkg = JSON.parse(fs.readFileSync(path.join(pluginPath, 'package.json')))
    var hapiHook = loadModule(path.join(pluginPath, 'hooks', 'hapi'))
    var staticHook = loadModule(path.join(pluginPath, 'hooks', 'static'))

    return {
      path: pluginPath,
      pkg: pkg,
      hooks: {
        static: staticHook,
        hapi: hapiHook ? _.defaultsDeep(hapiHook, {
          attributes: {
            name: pkg.name
          }
        }) : null
      }
    }
  })
  .mapKeys(function (plugin) {
    return plugin.pkg.name
  })
  .value()
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

module.exports = registerPlugins

var log = require('npmlog')
var requireResolve = require('./resolver')

function checkModule (modulePath) {
  try {
    requireResolve(modulePath)
    return true
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
    return false
  }
}

function registerPlugins (server, options, callback) {
  var hapiPlugins = [
    require('inert')
  ]

  var localPlugins = [
    './client',
    './logger',
    './maybe-force-gzip',
    './public'
  ].map(function (pluginPath) {
    return {
      options: options,
      register: require(pluginPath)
    }
  })

  var externalPlugins = options.plugins
    .filter(function (pluginPath) {
      return checkModule(pluginPath + '/hoodie/server')
    })
    .map(function (pluginPath) {
      var pkg = require(pluginPath + '/package.json')
      var pluginName = pkg.hoodie ? pkg.hoodie.name || pkg.name : pkg.name
      var hapiPluginOptions = require(pluginPath + '/hoodie/server')

      if (!hapiPluginOptions.register) {
        hapiPluginOptions = { register: hapiPluginOptions }
      }

      hapiPluginOptions.options = options
      hapiPluginOptions.routes = { prefix: '/hoodie/' + pluginName }

      return hapiPluginOptions
    })

  var plugins = hapiPlugins.concat(localPlugins, externalPlugins)

  log.silly('hapi', 'Registering plugins')

  server.register(plugins, function (error) {
    if (error) {
      return callback(error)
    }

    log.info('hapi', 'plugins registered')
    callback(null)
  })
}

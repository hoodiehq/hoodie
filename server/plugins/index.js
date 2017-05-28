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
    'inert'
  ]

  var localPlugins = [
    './client',
    './logger',
    './maybe-force-gzip',
    './public'
  ]

  var externalPlugins = options.plugins
    .filter(function (pluginPath) {
      return checkModule(pluginPath + '/hoodie/server')
    })
    .map(function (pluginPath) {
      var pkg = require(pluginPath + '/package.json')
      var pluginName = pkg.hoodie ? pkg.hoodie.name || pkg.name : pkg.name

      return {
        register: pluginPath + '/hoodie/server',
        routes: { prefix: '/hoodie/' + pluginName }
      }
    })

  var plugins = hapiPlugins.concat(localPlugins, externalPlugins)
    .map(function (register) {
      var path = register.register ? register.register : register
      return {
        options: options,
        register: require(path),
        routes: register.routes
      }
    })

  log.silly('hapi', 'Registering internal plugins')
  server.register(plugins, function (error) {
    if (error) {
      return callback(error)
    }

    log.info('hapi', 'plugins registered')
    callback(null)
  })
}

module.exports = registerPlugins

var log = require('npmlog')
var path = require('path')
var defaultsDeep = require('lodash').defaultsDeep

function registerPlugins (server, config, callback) {
  var options = {
    config: config
  }
  var hapiPlugins = [
    require('h2o2'),
    require('inert'),
    require('vision'),
    require('lout')
  ]
  var localPlugins = [
    require('./logger'),
    require('./maybe-force-gzip'),
    require('./public')
  ].map(function (register) {
    return {
      options: options,
      register: register
    }
  })
  var hoodieCorePlugins = ['account', 'store'].map(function (name) {
    return {
      register: require('@hoodie/' + name),
      options: config[name],
      routes: {
        prefix: '/hoodie/' + name + '/api'
      }
    }
  })
  var thirdPartyPlugins = Object.keys(config.plugins).map(function (key) {
    var plugin = config.plugins[key]

    // check if package is path
    if (path.relative(plugin.package, process.cwd())) plugin.package = path.resolve(plugin.package)

    // can we find the package?
    try {
      require.resolve(plugin.package)
    } catch (e) {
      return false
    }

    // hapi requires the exported function AND attributes
    var register = defaultsDeep(require(plugin.package), {
      attributes: {
        name: plugin.name,
        pkg: require(plugin.package + '/package.json')
      }
    })

    var hapiPlugin = {
      register: register,
      options: plugin.options,
      routes: plugin.routes
    }

    log.silly('hapi', 'Registering "' + plugin.name + '" plugin')

    return hapiPlugin
  }).filter(function (plugin) {
    return plugin
  })
  var plugins = hapiPlugins.concat(localPlugins, hoodieCorePlugins, thirdPartyPlugins)

  log.silly('hapi', 'Registering internal plugins')
  server.register(plugins, function (error) {
    if (error) {
      return callback(error)
    }

    log.info('hapi', 'plugins registered')
    callback(null)
  })
}

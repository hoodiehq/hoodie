module.exports = registerPlugins

var log = require('npmlog')

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
  if (!('plugins' in config)) config.plugins = []
  var thirdPartyPlugins = config.plugins.map(function (plugin) {
    if (typeof plugin === 'string') plugin = {name: plugin}

    var module = 'hoodie-plugin-' + plugin.name
    if ('module' in plugin) module = plugin.module

    try {
      require.resolve(module)
    } catch (e) {
      return false
    }

    var hapiPlugin = {
      register: require(module),
      options: plugin,
      routes: {
        prefix: '/hoodie/' + plugin.name + '/api'
      }
    }

    // possibly put checks for non-standard overrides here, such as plugin path, custom routes, etc

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

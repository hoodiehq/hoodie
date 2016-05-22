module.exports = registerPlugins

var log = require('npmlog')
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
  var thirdPartyPlugins = Object.keys(config.plugins).map(function (name) {
    var plugin = config.plugins[name]
    var pkg

    // can we find the package?
    try {
      pkg = require(plugin.package)
    } catch (e) {
      log.error('server', 'cannot find plugin %s', plugin.package)
      process.exit(1)
    }

    // hapi requires the exported function AND attributes
    var register = defaultsDeep(pkg, {
      attributes: {
        name: plugin.name,
        pkg: require(plugin.package + '/package.json')
      }
    })

    log.silly('hapi', 'Registering "' + plugin.name + '" plugin')

    return {
      register: register,
      options: plugin.options,
      routes: {
        prefix: '/hoodie/' + name + '/api'
      }
    }
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

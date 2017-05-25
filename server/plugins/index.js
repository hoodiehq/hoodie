module.exports = registerPlugins

var log = require('npmlog')
var path = require('path')
var requireResolve = require('./resolver')

function checkModule (module) {
  try {
    requireResolve(module)
    return true
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
    return false
  }
}

function registerPlugins (server, config, callback) {

  // TODO: port away from Objec.assign (or require Node 6.0.0+ for Hoodie)
  var options = Object.assign({ config: config }, config.pluginOptions)

  var hapiPlugins = [
    require('inert')
  ]
  config.plugins = config.plugins || [] // doesn’t work, config.plugins is {} here
  if (Object.keys(config.plugins).length === 0) {
    config.plugins = [] // workaround for above issue
  }
  var localPlugins = [
    './client',
    './logger',
    './maybe-force-gzip',
    './public'
  ]
    .concat(
  [
    path.resolve('hoodie/server'),
  ]
    .concat(config.plugins.map(function (i) { i + '/hoodie/server' }))
    .filter(checkModule)
    )
    .map(function (register) {
      return {
        options: options,
        register: require(register)
      }
    })

  log.silly('hapi', 'Registering internal plugins')
  server.register(hapiPlugins.concat(localPlugins), function (error) {
    if (error) {
      return callback(error)
    }

    log.info('hapi', 'plugins registered')
    callback(null)
  })
}

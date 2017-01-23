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
  var options = {
    config: config
  }
  var hapiPlugins = [
    require('inert')
  ]

  var localPlugins = [
    './client',
    './logger',
    './maybe-force-gzip',
    './public'
  ]
    .concat(
  [
    path.resolve('hoodie/server')
  ]
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

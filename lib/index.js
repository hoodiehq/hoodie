var _ = require('lodash')
var async = require('async')
var hapi = require('hapi')
var log = require('npmlog')

module.exports = function (options, callback) {
  'use strict'

  log.level = options.loglevel || 'warn'

  var env_config

  try {
    env_config = require('./config')(options)
  } catch (err) {
    return callback(err)
  }

  var serverOptions = {}
  _.set(serverOptions, 'connections.routes.payload.maxBytes', 1048576 * 10) // 10 MB

  var server = new hapi.Server(serverOptions)

  async.applyEachSeries([
    require('./database/start'),
    require('./database/install'),
    require('./bundle'),
    require('./plugins')
  ], env_config, function (err) {
    if (err) return callback(err)

    server.connection({
      port: env_config.app.port
    })

    log.silly('hapi', 'Registering internal plugins')
    server.register(require('./hapi')(env_config), function (err) {
      if (err) return callback(err)

      log.verbose('hapi', 'Registerd internal plugins')
      callback(null, server, env_config)
    })
  })
}

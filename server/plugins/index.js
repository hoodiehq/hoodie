module.exports = registerPlugins

var log = require('npmlog')

function registerPlugins (server, config, callback) {
  var options = {
    config: config
  }
  var hapiPlugins = [
    require('inert')
  ]
  var localPlugins = [
    require('./client'),
    require('./logger'),
    require('./maybe-force-gzip'),
    require('./public')
  ].map(function (register) {
    return {
      options: options,
      register: register
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

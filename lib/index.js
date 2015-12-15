var hapi = require('hapi')
var log = require('npmlog')

module.exports = function (options, callback) {
  'use strict'

  log.level = options.loglevel || 'warn'

  var config = require('./config')(options)

  var server = new hapi.Server()

  require('./couchdb')(config, function (err, couchConfig) {
    /* istanbul ignore next */
    if (err) return callback(err)

    config.db.secret = couchConfig.secret

    server.connection({
      host: config.app.hostname,
      port: config.app.port,
      routes: {
        cors: {
          credentials: true
        }
      }
    })

    log.silly('hapi', 'Registering internal plugins')
    require('./hapi')(config, couchConfig.authentication_db, function (err, plugins) {
      /* istanbul ignore next */
      if (err) return callback(err)

      server.register(plugins, function (err) {
        /* istanbul ignore next */
        if (err) return callback(err)

        log.verbose('hapi', 'Registerd internal plugins')
        callback(null, server, config)
      })
    })
  })
}

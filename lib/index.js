var _ = require('lodash')
var hapi = require('hapi')
var log = require('npmlog')
var request = require('request')

module.exports = function (options, callback) {
  'use strict'

  log.level = options.loglevel || 'warn'

  var config = require('./config')(options)

  var server = new hapi.Server()

  checkExternalDatabase(config, function (err) {
    if (err) return callback(err)

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
    server.register(require('./hapi')(config), function (err) {
      if (err) return callback(err)

      log.verbose('hapi', 'Registerd internal plugins')
      callback(null, server, config)
    })
  })
}

function checkExternalDatabase (config, callback) {
  if (!config.db.url) return callback(null)

  log.info('database', 'Using external: ' + config.db.url)
  log.silly('database', 'Checking for support')

  request({
    url: config.db.url,
    json: true
  }, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not find CouchDB at ' + config.db.url))
    }

    var vendor = _.findKey(data, function (prop) {
      return /^welcome/i.test(prop)
    })

    if (vendor !== 'couchdb' && vendor !== 'express-pouchdb') {
      log.warn(
        'database',
        'You are not running an official CouchDB distribution, ' +
        'but "' + vendor + '". ' +
        'This might not be fully supported. Proceed at your own risk.'
      )
      return callback(null)
    }

    if (vendor === 'express-pouchdb') {
      log.verbose('database', 'External vendor (' + vendor + ') supported')
    }
    callback(null)
  })
}

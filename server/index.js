module.exports = getHoodieServer

var async = require('async')
var hapi = require('hapi')
var log = require('npmlog')

var bundleClient = require('./bundle-client')
var getConfig = require('./config')
var registerPlugins = require('./plugins')
var userDatabases = require('./utils/user-databases')
var corsHeaders = require('hapi-cors-headers')

function getHoodieServer (options, callback) {
  getConfig(options, function (error, config) {
    if (error) {
      return callback(error)
    }
    var hapiConfig = {}

    if (log.level === 'debug') {
      hapiConfig = {
        debug: {
          request: ['error'],
          log: ['error']
        }
      }
    }

    var server = new hapi.Server(hapiConfig)
    server.connection(config.connection)
    server.ext('onPreResponse', corsHeaders)

    async.parallel([
      registerPlugins.bind(null, server, config),
      bundleClient.bind(null, config)
    ], function (error) {
      if (error) {
        return callback(error)
      }

      // add / remove user databases on signups / account deletions
      server.plugins.account.api.accounts.on('add', userDatabases.add.bind(null, config, server))
      server.plugins.account.api.accounts.on('remove', userDatabases.remove.bind(null, config, server))

      callback(null, server, config)
    })
  })
}

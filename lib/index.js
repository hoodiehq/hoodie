var fs = require('fs')
var path = require('path')

var async = require('async')
var hapi = require('hapi')
var log = require('npmlog')

var userDatabases = require('./core-modules-glue-code/user-databases')

module.exports = function (options, callback) {
  'use strict'

  log.level = options.loglevel || 'warn'

  var config = require('./config')(options)

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

    async.parallel([
      loadPlugins.bind(null, server, config, couchConfig),
      bundleHoodieClient.bind(null, config)
    ], function (error) {
      callback(error, server, config)
    })
  })
}

function loadPlugins (server, config, couchConfig, callback) {
  require('./hapi')(config, couchConfig, function (error, plugins) {
    /* istanbul ignore next */
    if (error) {
      return callback(error)
    }

    log.silly('hapi', 'Registering internal plugins')

    server.register(plugins, function (error) {
      if (error) {
        return callback(error)
      }

      server.plugins.account.api.accounts.on('add', userDatabases.add.bind(null, config, server))
      server.plugins.account.api.accounts.on('remove', userDatabases.remove.bind(null, config, server))

      log.info('hapi', 'plugins registered')
      callback(null, server, config)
    })
  })
}

function bundleHoodieClient (config, callback) {
  var hoodieClientModulePath = path.dirname(require.resolve('hoodie-client/package.json'))
  var hoodieClientPath = path.join(hoodieClientModulePath, 'dist/hoodie.js')
  var bundleTargetPath = path.resolve('./.hoodie/client.js')

  // https://github.com/hoodiehq/hoodie-client/issues/34
  // var hoodieMinPath = path.join(hoodieClientModulePath, 'dist/hoodie.min.js')

  log.silly('bundle', 'bundling ' + hoodieClientPath + ' into ' + bundleTargetPath)

  var stream = fs.createReadStream(hoodieClientPath)
  stream.pipe(fs.createWriteStream(bundleTargetPath))
  stream.on('error', callback)
  stream.on('end', function () {
    // TODO: pass client configuration to constructor
    fs.appendFile(bundleTargetPath, '\n\nhoodie = new Hoodie()', function (error) {
      if (error) {
        return callback(error)
      }

      log.silly('bundle', 'appended Hoodie init code to ' + bundleTargetPath)
      log.info('bundle', 'bundled Hoodie client into ' + bundleTargetPath)

      callback()
    })
  })
}

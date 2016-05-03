module.exports = getHoodieServer

var fs = require('fs')
var path = require('path')

var async = require('async')
var hapi = require('hapi')
var log = require('npmlog')

var getConfig = require('./config')
var registerPlugins = require('./plugins')
var userDatabases = require('./utils/user-databases')

function getHoodieServer (options, callback) {
  log.level = options.loglevel || 'warn'

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
      registerPlugins.bind(null, server, config),
      bundleHoodieClient.bind(null, config)
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

function bundleHoodieClient (config, callback) {
  var hoodieClientModulePath = path.dirname(require.resolve('@hoodie/client/package.json'))
  var hoodieClientPath = path.join(hoodieClientModulePath, 'dist/hoodie.js')
  var bundleTargetPath = path.join(config.paths.data, 'client.js')

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

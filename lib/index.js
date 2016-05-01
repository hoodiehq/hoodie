module.exports = getHoodieServer

var fs = require('fs')
var path = require('path')

var async = require('async')
var hapi = require('hapi')
var log = require('npmlog')
var mkdirp = require('mkdirp')

var userDatabases = require('./core-modules-glue-code/user-databases')

function getHoodieServer (options, callback) {
  log.level = options.loglevel || 'warn'

  var config = require('./config')(options)
  var hapiConfig = {}
  var willWritePouchDbFiles = !options.dbUrl && !options.inMemory

  if (log.level === 'debug') {
    hapiConfig = {
      debug: {
        request: ['error'],
        log: ['error']
      }
    }
  }

  mkdirp.sync(config.paths.data)
  if (willWritePouchDbFiles) {
    mkdirp.sync(config.db.prefix)
  }

  var publicFolderExists
  try {
    publicFolderExists = fs.statSync(config.paths.public).isDirectory()
  } catch (err) {
    publicFolderExists = false
  }

  if (!publicFolderExists) {
    config.paths.public = path.resolve(__dirname, '../public')
    log.info('config', 'The "public" app path does not exist. Serving ' + config.paths.public)
  }

  var server = new hapi.Server(hapiConfig)

  require('./couchdb')(config, function (error, couchConfig) {
    /* istanbul ignore next */
    if (error) {
      return callback(error)
    }

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

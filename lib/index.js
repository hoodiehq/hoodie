/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var domain = require('domain')

var async = require('async')
var Hapi = require('hapi')

var config = require('./core/config.js')
var couch = require('./couchdb')
var hapi_plugins = require('./hapi_plugins')
var hooks = require('./core/hooks')
var installer = require('./couchdb/installer')
var log = require('./utils/log')
var plugins = require('./core/plugins')
var utils = require('./utils')

exports.start = function (options, callback) {
  var app_domain = domain.create()

  var env_config = config(options)

  // wrap in top-level domain, otherwise we sometimes don't get uncaught
  // exceptions printed in node 0.10.x
  app_domain.run(exports.init.bind(null, env_config, callback))

  // make sure we print a stack trace in node 0.10.x
  app_domain.on('error', function (err) {
    if (err.stack) {
      log.error(err.message || err.toString(), err.stack)
    } else if (err.message && !err.stack) {
      log.error(err.message)
    } else if (err.message) {
      log.error(err.message, err)
    } else {
      log.error('Error', err)
    }

    if (err.code === 'MODULE_NOT_FOUND') {
      log.error('A module couldn\'t be found, so try running `npm install` again')
    }
    process.exit(1)
  })
}

var options = {
  connections: {
    routes: {
      cors: {override: false},
      payload: {maxBytes: 1048576 * 10} // 10 MB
    }
  }
}

exports.init = function (env_config, callback) {
  if (log.levels[log.raw.level] < 2000) {
    log.verbose('Showing hapi\'s internal debug output')
    options.debug = {
      log: ['error'],
      request: ['error']
    }
  }

  var server = new Hapi.Server(options)

  async.applyEachSeries([
    utils.ensurePaths,
    couch.start,
    installer.install,
    plugins.load,
    hooks,
    exports.configureServer.bind(null, server),
    plugins.startAll,
    utils.processSend
  ], env_config, function (err) {
    if (err) return callback(err)

    callback(null, server, env_config)
  })
}

exports.configureServer = function (server, env_config, callback) {
  env_config.hooks.runStatic('server.pack.pre', [server])

  server.connection({
    port: env_config.www_port,
    labels: ['web']
  })

  server.connection({
    port: env_config.admin_port,
    labels: ['admin']
  })

  log.silly('Registering internal hapi plugins')

  var plugins = [require('inert'), require('h2o2')]
  server.register(
    plugins.concat(hapi_plugins.map(function (plugin) {
      return {
        register: plugin,
        options: {
          app: env_config
        }
      }
    })),
    function (err) {
      if (err) return callback(err)

      log.verbose('Registerd internal hapi plugins')

      env_config.hooks.runStatic('server.pack.post', [server])

      callback(null)
    }
  )
}

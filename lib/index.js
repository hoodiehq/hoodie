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
    console.error(err.stack || err.toString())
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
  if (env_config.debug) {
    options.debug = {
      log: ['error'],
      request: ['error']
    }
  }

  var server = new Hapi.Server(options)

  async.applyEachSeries([
    utils.ensurePaths,
    utils.showConfigPath,
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

  server.register(
    hapi_plugins.map(function (plugin) {
      return {
        register: plugin,
        options: {
          app: env_config
        }
      }
    }),
    function (err) {
      if (err) return callback(err)

      env_config.hooks.runStatic('server.pack.post', [server])

      callback(null)
    }
  )
}

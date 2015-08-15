/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var domain = require('domain')

var async = require('async')
var Hapi = require('hapi')
var mkdirp = require('mkdirp')

var config = require('./config.js')
var couch = require('./couchdb')
var hapi = require('./hapi')
var hooks = require('./hooks')
var log = require('./log')
var plugins = require('./plugins')

var exports = module.exports = function (options, callback) {
  var app_domain = domain.create()

  var env_config = config(options)

  // wrap in top-level domain, otherwise we sometimes don't get uncaught
  // exceptions printed in node 0.10.x
  app_domain.run(exports.init.bind(null, env_config, callback))

  // make sure we print a stack trace in node 0.10.x
  app_domain.on('error', function (err) {
    if (err.stack) {
      log.error('app', err.message || err.toString(), err.stack)
    } else if (err.message && !err.stack) {
      log.error('app', err.message)
    } else if (err.message) {
      log.error('app', err.message, err)
    } else {
      log.error('app', 'Error', err)
    }

    if (err.code === 'MODULE_NOT_FOUND') {
      log.error('app', 'A module couldn\'t be found, so try running `npm install` again')
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
  if (log.raw.levels[log.raw.level] < 4000) {
    log.verbose('hapi', 'Showing internal debug output')
    options.debug = {
      log: ['error'],
      request: ['error']
    }
  }

  var server = new Hapi.Server(options)

  async.applyEachSeries([
    async.apply(mkdirp, env_config.hoodie.data_path),
    couch,
    plugins.load,
    async.apply(exports.configureServer, server),
    plugins.startAll
  ], env_config, function (err) {
    if (err) return callback(err)

    callback(null, server, env_config)
  })
}

exports.configureServer = function (server, env_config, callback) {
  var configuredHooks = hooks(env_config)
  configuredHooks.runStatic('server.pack.pre', [server])

  server.connection({
    port: env_config.www_port,
    labels: ['web']
  })

  server.connection({
    port: env_config.admin_port,
    labels: ['admin']
  })

  log.silly('hapi', 'Registering internal plugins')
  server.register(hapi(env_config), function (err) {
    if (err) return callback(err)

    log.verbose('hapi', 'Registerd internal plugins')
    configuredHooks.runStatic('server.pack.post', [server])
    callback(null)
  })
}

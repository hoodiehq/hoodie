var url = require('url')

var _ = require('lodash')
var log = require('npmlog')

var exports = module.exports = function (options, callback) {
  var env_config = require('./config')(options)

  log.level = options.loglevel || 'warn'

  if (!env_config.db.auth) {
    return callback(new Error('Authentication details missing from database URL'))
  }

  exports.init(env_config, callback)
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
  var async = require('async')
  var hapi = require('hapi')

  var server = new hapi.Server(options)
  var plugins = require('./plugins')

  async.applyEachSeries([
    require('./database/start'),
    require('./database/install'),
    plugins.load,
    require('./bundle'),
    async.apply(exports.configureServer, server),
    plugins.startAll
  ], env_config, function (err) {
    if (err) return callback(err)

    callback(null, server, env_config)
  })
}

exports.configureServer = function (server, env_config, callback) {
  env_config.hooks = require('./hooks')(env_config)
  env_config.hooks.runStatic('server.pack.pre', [server])

  server.connection({
    port: env_config.app.port,
    labels: ['web']
  })

  server.connection({
    port: env_config.admin.port,
    labels: ['admin']
  })

  log.silly('hapi', 'Registering internal plugins')
  var couchdbStore = {
    register: require('hapi-couchdb-store/lib/routes/couchdb-proxy'),
    options: {
      couchdb: url.format(_.omit(env_config.db, 'auth')),
      prefix: '/hoodie/store'
    }
  }
  server.register(require('./hapi')(env_config).concat([couchdbStore]), function (err) {
    if (err) return callback(err)

    log.verbose('hapi', 'Registerd internal plugins')
    env_config.hooks.runStatic('server.pack.post', [server])
    callback(null)
  })
}

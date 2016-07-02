module.exports = parseOptions

var path = require('path')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')
var stripUrlAuth = require('strip-url-auth')

var getDefaults = require('./defaults')

/**
 * Parse options into internal config structure.
 *
 * Options are all the things that users can pass in to Hoodie as described at
 * https://github.com/hoodiehq/hoodie#usage. All these options are flat, while
 * internally we group theem into db, connection and path options.
 *
 * `appOptions` are app-specific default options configured in the
 * app’s package.json (on the `"hoodie"` key).
 *
 * The parsing of the database configuration is a bit more complex. If `dbUrl`
 * is passed it means that a remote CouchDB is used for persistance, otherwise
 * PouchDB is being used. A shortcut to set PouchDB’s adapter to memdown is to
 * passe set the `inMemory: true` option. If it’s not set, leveldown is used
 * with the prefix set to `options.data` + 'data' (`.hoodie/data` by default).
 */
function parseOptions (options, appOptions, callback) {
  defaultsDeep(options, appOptions)

  var config = {
    loglevel: options.loglevel,
    paths: {
      data: options.data,
      public: options.public
    },
    connection: {
      host: options.bindAddress,
      port: options.port
    },
    db: {}
  }

  defaultsDeep(config, getDefaults())

  log.level = config.loglevel

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    log.info('config', 'Connecting to CouchDB at ' + stripUrlAuth(options.dbUrl))
  } else {
    if (options.inMemory) {
      log.info('config', 'Storing all data in memory only')
      config.db.db = require('memdown')
      config.inMemory = true
    } else {
      config.db.prefix = path.join(config.paths.data, 'data' + path.sep)
      log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
      log.info('config', 'Writing PouchDB database files to ' + config.db.prefix)
    }
  }

  return config
}

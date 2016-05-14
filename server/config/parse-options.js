module.exports = parseOptions

var path = require('path')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')
var extend = require('extend')

var getDefaults = require('./defaults')
var removeAuth = require('../utils/remove-auth-from-url')

function parseOptions (options, callback) {
  var config = extend(true, options, {
    loglevel: options.loglevel,
    paths: {
      data: options.data,
      public: options.public
    },
    connection: {
      host: options.bindAddress,
      port: options.port
    },
    db: {},
    plugins: []
  })

  defaultsDeep(config, getDefaults())

  log.level = config.loglevel

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    log.info('config', 'Connecting to CouchDB at ' + removeAuth(options.dbUrl))
  } else {
    if (options.inMemory) {
      log.info('config', 'Storing all data in memory only')
      config.db.db = require('memdown')
    } else {
      config.db.prefix = path.join(config.paths.data, 'data' + path.sep)
      log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
      log.info('config', 'Writing PouchDB database files to ' + config.db.prefix)
    }
  }

  return config
}

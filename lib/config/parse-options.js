module.exports = parseOptions

var path = require('path')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')

var getDefaults = require('./defaults')
var removeAuth = require('../utils/remove-auth-from-url')

function parseOptions (options, callback) {
  var config = {
    db: {},
    paths: {
      data: options.data,
      public: options.public
    },
    app: {
      hostname: options.bindAddress,
      port: options.port,
      protocol: options.protocol
    }
  }

  defaultsDeep(config, getDefaults())

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    log.info('config', 'Connecting to CouchDB at ' + removeAuth(options.dbUrl))
  } else {
    if (options.inMemory) {
      log.info('config', 'Storing all data in memory only')
      config.db.db = require('memdown')
    } else {
      config.db.prefix = path.join(config.paths.data, 'data')
      log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
      log.info('config', 'Writing PouchDB database files to ' + config.db.prefix)
    }
  }

  return config
}

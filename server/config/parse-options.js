module.exports = parseOptions

var fs = require('fs')
var path = require('path')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')

var getDefaults = require('./defaults')
var removeAuth = require('../utils/remove-auth-from-url')

function parseOptions (options, callback) {
  var projectPath = process.cwd()

  var config = {
    loglevel: options.loglevel,
    paths: {
      data: fs.existsSync(path.join(projectPath, options.data)) ? path.normalize(path.join(projectPath, options.data)) : undefined,
      public: fs.existsSync(path.join(projectPath, options.public)) ? path.normalize(path.join(projectPath, options.public)) : undefined
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

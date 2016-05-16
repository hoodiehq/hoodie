module.exports = parseOptions

var path = require('path')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')
var extend = require('extend')

var getDefaults = require('./defaults')
var removeAuth = require('../utils/remove-auth-from-url')

function parseOptions (options, callback) {
  // collect options from all sources and merge
  var projectPath = process.cwd()
  var pkg = require(path.join(projectPath, 'package.json'))
  if (!('hoodie' in pkg)) pkg.hoodie = {}

  // merged options
  // assume packageOptions are the base, anything from rc extends on this
  extend(true, options, pkg.hoodie)

  // construct final config
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

  // defaults are applied after user configurations are merged
  defaultsDeep(config, getDefaults())
  // we also want to merge config back with options so the user has access to all options
  extend(true, config, options)

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

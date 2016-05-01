module.exports = getConfig
var internals = module.exports.internals = {
  getDefaults: require('./defaults')
}

var path = require('path')
var url = require('url')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')

function getConfig (options) {
  var defaults = internals.getDefaults()
  var config = {
    paths: {
      data: options.data,
      public: options.public
    },
    app: {
      hostname: options.bindAddress,
      port: options.port
    }
  }

  defaultsDeep(config, defaults)

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    if (!url.parse(options.dbUrl).auth) {
      log.error('config', 'Authentication details missing from database URL: ' + options.dbUrl)
      process.exit(0)
    }

    log.info('config', 'Connecting to CouchDB at ' + options.dbUrl.replace(url.parse(options.dbUrl).auth + '@', ''))
  } else {
    log.info('config', 'No CouchDB URL provided, falling back to PouchDB')

    if (options.inMemory) {
      log.info('config', 'Not writing any files, all data is stored in memory.')
      config.db.db = require('memdown')
    } else {
      config.db.prefix = path.join(config.paths.data, 'data/')
      log.info('config', 'Writing database files to ' + config.db.prefix)
    }
  }

  return config
}

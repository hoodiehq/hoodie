module.exports = getConfig
var internals = module.exports.internals = {
  getDefaults: require('./defaults'),
  couchDbConfig: require('./db/couchdb'),
  pouchDbConfig: require('./db/pouchdb')
}

var parseUrl = require('url').parse
var path = require('path')

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')

var getDatabaseFactory = require('./db/factory')

function getConfig (options, callback) {
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
  var getDbConfig

  defaultsDeep(config, defaults)

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    if (!parseUrl(options.dbUrl).auth) {
      return callback('Authentication details missing from database URL: ' + options.dbUrl)
    }

    log.info('config', 'Connecting to CouchDB at ' + removeAuth(options.dbUrl))

    getDbConfig = internals.couchDbConfig
  } else {
    if (options.inMemory) {
      log.info('config', 'Storing all data in memory')
      config.db.db = require('memdown')
    } else {
      config.db.prefix = path.join(config.paths.data, 'data/')
      log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
      log.info('config', 'Writing PouchDB database files to ' + config.db.prefix)
    }

    getDbConfig = internals.pouchDbConfig
  }

  getDbConfig(config, function (error, couchConfig) {
    if (error) {
      return callback(error)
    }

    config.db.secret = couchConfig.secret
    config.db.admins = couchConfig.admins
    config.db.authenticationDb = couchConfig.authentication_db

    var getDatabase = getDatabaseFactory(config)
    var usersDb = getDatabase(config.db.authenticationDb)
    usersDb.constructor.plugin(require('pouchdb-users'))

    usersDb.installUsersBehavior()

    .then(function () {
      // account config
      defaultsDeep(config.account, {
        admins: couchConfig.admins,
        secret: config.db.secret,
        usersDb: usersDb,
        notifications: config.account.notifications
      })

      // store config
      if (config.db.url) {
        config.store.couchdb = removeAuth(config.db.url)
      } else {
        config.store.PouchDB = usersDb.constructor
      }

      callback(null, config)
    })

    .catch(callback)
  })
}

function removeAuth (url) {
  var parts = parseUrl(url)
  return url.replace(parts.auth + '@', '')
}

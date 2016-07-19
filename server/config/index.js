module.exports = getConfig

var parseUrl = require('url').parse
var series = require('async').series
var statSync = require('fs').statSync
var resolvePath = require('path').resolve

var defaultsDeep = require('lodash').defaultsDeep
var log = require('npmlog')

var accountConfig = require('./account')
var assureFolders = require('./assure-folders')
var couchDbConfig = require('./db/couchdb')
var getDatabaseFactory = require('./db/factory')
var getDefaults = require('./defaults')
var pouchDbConfig = require('./db/pouchdb')
var storeConfig = require('./store')

function getConfig (config, callback) {
  defaultsDeep(config, getDefaults())
  var dbConfig = config.db.url ? couchDbConfig : pouchDbConfig
  var state = {
    config: config,
    getDatabase: getDatabaseFactory(config)
  }

  if (config.db.url && !parseUrl(config.db.url).auth) {
    return callback('Authentication details missing from database URL: ' + config.db.url)
  }

  // check if app has public folder. Fallback to Hoodie’s public folder if not
  try {
    statSync(config.paths.public).isDirectory()
  } catch (err) {
    config.paths.public = resolvePath(__dirname, '../../public')
    log.info('config', 'The "public" app path does not exist. Serving ' + config.paths.public)
  }

  series([
    assureFolders.bind(null, state),
    dbConfig.bind(null, state),
    accountConfig.bind(null, state),
    storeConfig.bind(null, state)
  ], function (error) {
    callback(error, state.config)
  })
}

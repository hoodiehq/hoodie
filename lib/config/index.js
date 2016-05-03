module.exports = getConfig

var parseUrl = require('url').parse
var series = require('async').series
var statSync = require('fs').statSync
var resolvePath = require('path').resolve

var log = require('npmlog')

var accountConfig = require('./account')
var couchDbConfig = require('./db/couchdb')
var getDatabaseFactory = require('./db/factory')
var parseOptions = require('./parse-options')
var pouchDbConfig = require('./db/pouchdb')
var storeConfig = require('./store')

function getConfig (options, callback) {
  if (options.dbUrl && !parseUrl(options.dbUrl).auth) {
    return callback('Authentication details missing from database URL: ' + options.dbUrl)
  }

  var config = parseOptions(options)
  var state = {
    config: config,
    getDatabase: getDatabaseFactory(config)
  }
  var dbConfig = state.config.db.url ? couchDbConfig : pouchDbConfig

  // check if app has public folder. Fallback to Hoodie’s public folder if not
  try {
    statSync(config.paths.public).isDirectory()
  } catch (err) {
    config.paths.public = resolvePath(__dirname, '../../public')
    log.info('config', 'The "public" app path does not exist. Serving ' + config.paths.public)
  }

  series([
    dbConfig.bind(null, state),
    accountConfig.bind(null, state),
    storeConfig.bind(null, state)
  ], function (error) {
    callback(error, state.config)
  })
}

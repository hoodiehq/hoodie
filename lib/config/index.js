module.exports = getConfig
var internals = module.exports.internals = {
  accountConfig: require('./account'),
  couchDbConfig: require('./db/couchdb'),
  getDatabaseFactory: require('./db/factory'),
  parseOptions: require('./parse-options'),
  pouchDbConfig: require('./db/pouchdb'),
  storeConfig: require('./store')
}

var parseUrl = require('url').parse
var series = require('async').series

function getConfig (options, callback) {
  if (options.dbUrl && !parseUrl(options.dbUrl).auth) {
    return callback('Authentication details missing from database URL: ' + options.dbUrl)
  }

  var config = internals.parseOptions(options)
  var state = {
    config: config,
    getDatabase: internals.getDatabaseFactory(config)
  }
  var dbConfig = state.config.db.url ? internals.couchDbConfig : internals.pouchDbConfig
  state.getDatabase.PouchDB.plugin(require('pouchdb-users'))

  series([
    dbConfig.bind(null, state),
    internals.accountConfig.bind(null, state),
    internals.storeConfig.bind(null, state)
  ], function (error) {
    callback(error, state.config)
  })
}

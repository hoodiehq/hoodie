/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var async = require('async')

var couchUtils = require('../utils/couch')
var credentials = require('./credentials')

/**
 * Creates internal admin user and prmpts for Hoodie admin
 */

exports.setupUsers = function (env_config, callback) {
  couchUtils.isAdminParty(env_config, function (err, party) {
    if (err) {
      return callback(err)
    }

    if (!party) {
      return couchUtils.updateCouchCredentials(env_config, callback)
    }

    async.applyEachSeries([
      couchUtils.createCouchCredentials,
      couchUtils.createAdminUser
    ], env_config, callback)
  })
}

/**
 * Create app DB and config doc
 */

exports.setupApp = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  async.applyEachSeries([
    couchUtils.createDB('app'),
    couchUtils.createAppConfig
  ], env_config, couchdb.username, couchdb.password, callback)
}

/**
 * Creates plugin DB
 */

exports.setupPlugins = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  couchUtils.createDB('plugins')(env_config, couchdb.username, couchdb.password, callback)
}

/**
 * Sets Hoodie-sepcific CouchDB configuration
 */
exports.setupConfig = function (env_config, callback) {
  couchUtils.setConfig(
    env_config,
    'httpd',
    'authentication_handlers',
    '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}',
    callback
  )
}

/**
 * Checks CouchDB for required users/dbs, prmpts user for info
 * where appropriate
 */

exports.install = async.applyEachSeries([
  exports.setupUsers,
  exports.setupApp,
  exports.setupPlugins,
  exports.setupConfig
])

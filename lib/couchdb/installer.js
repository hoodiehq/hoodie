/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var async = require('async')

var couchUtils = require('../utils/couch')
var credentials = require('./credentials')
var log = require('../utils/log')

exports.setupUsers = function (env_config, callback) {
  couchUtils.isAdminParty(env_config, function (err, party) {
    if (err) {
      return callback(err)
    }

    if (!party) {
      log.silly('Database not in admin party mode')
      return couchUtils.updateCouchCredentials(env_config, callback)
    }

    log.verbose('Database in admin party mode')
    async.applyEachSeries([
      couchUtils.createCouchCredentials,
      couchUtils.createAdminUser
    ], env_config, callback)
  })
}

exports.setupApp = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  async.applyEachSeries([
    couchUtils.createDB('app'),
    couchUtils.createAppConfig
  ], env_config, couchdb.username, couchdb.password, callback)
}

exports.setupPlugins = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  couchUtils.createDB('plugins')(env_config, couchdb.username, couchdb.password, callback)
}

exports.setupConfig = function (env_config, callback) {
  log.verbose('Setting Hoodie-specific database config')
  couchUtils.setConfig(
    env_config,
    'httpd',
    'authentication_handlers',
    '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}',
    callback
  )
}

exports.install = async.applyEachSeries([
  exports.setupUsers,
  exports.setupApp,
  exports.setupPlugins,
  exports.setupConfig
])

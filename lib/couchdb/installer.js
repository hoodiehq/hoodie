/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var async = require('async')

var utils = require('./utils')
var log = require('../log')

var credentials = utils.credentials

exports.setupUsers = function (env_config, callback) {
  utils.isAdminParty(env_config, function (err, party) {
    if (err) {
      return callback(err)
    }

    if (!party) {
      log.silly('Database not in admin party mode')
      return utils.updateCouchCredentials(env_config, callback)
    }

    log.verbose('Database in admin party mode')
    async.applyEachSeries([
      utils.createCouchCredentials,
      utils.createAdminUser
    ], env_config, callback)
  })
}

exports.setupApp = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  async.applyEachSeries([
    utils.createDB('app'),
    utils.createAppConfig
  ], env_config, couchdb.username, couchdb.password, callback)
}

exports.setupPlugins = function (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  utils.createDB('plugins')(env_config, couchdb.username, couchdb.password, callback)
}

exports.setupConfig = function (env_config, callback) {
  log.verbose('Setting Hoodie-specific database config')
  utils.setConfig(
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

/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var async = require('async')

var utils = require('./utils')
var log = require('../log')

var credentials = utils.credentials

var exports = module.exports = async.applyEachSeries([
  setupUsers,
  setupApp,
  setupPlugins,
  setupConfig
])

exports.setupUsers = setupUsers
exports.setupApp = setupApp
exports.setupPlugins = setupPlugins
exports.setupConfig = setupConfig

function setupUsers (env_config, callback) {
  utils.isAdminParty(env_config, function (err, party) {
    if (err) {
      return callback(err)
    }

    if (!party) {
      log.silly('database', 'Not in admin party mode')
      return utils.updateCouchCredentials(env_config, callback)
    }

    log.verbose('database', 'In admin party mode')
    async.applyEachSeries([
      utils.createCouchCredentials,
      utils.createAdminUser
    ], env_config, callback)
  })
}

function setupApp (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  async.applyEachSeries([
    utils.createDB('app'),
    utils.createAppConfig
  ], env_config, couchdb.username, couchdb.password, callback)
}

function setupPlugins (env_config, callback) {
  var couchdb = credentials.get(env_config.hoodie.data_path)

  utils.createDB('plugins')(env_config, couchdb.username, couchdb.password, callback)
}

function setupConfig (env_config, callback) {
  log.verbose('database', 'Setting Hoodie-specific config')
  utils.setConfig(
    env_config,
    'httpd',
    'authentication_handlers',
    '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}',
    callback
  )
}

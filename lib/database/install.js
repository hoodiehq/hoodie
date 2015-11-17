/**
 * Sets up CouchDB admin and Hoodie related dbs
 */
var url = require('url')

var async = require('async')
var log = require('npmlog')
var request = require('request')

var utils = require('./utils')

var exports = module.exports = async.applyEachSeries([
  setupUsers,
  setupApp,
  setupConfig
])

exports.setupUsers = setupUsers
exports.setupApp = setupApp
exports.setupConfig = setupConfig

function setupUsers (env_config, callback) {
  async.applyEachSeries([
    utils.checkDbAdmin,
    utils.saveAdminUser
  ], env_config, callback)
}

function setupApp (env_config, callback) {
  var dbUrl = url.format(env_config.db)

  async.applyEachSeries([
    async.apply(utils.createDb, 'app'),
    async.apply(utils.createAppConfig, env_config.name)
  ], dbUrl, callback)
}

function setupConfig (env_config, callback) {
  log.verbose('database', 'Setting Hoodie-specific config')

  request({
    url: utils.urlJoin(env_config.db, '/_config/httpd/authentication_handlers'),
    method: 'PUT',
    json: true,
    body: '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}'
  }, callback)
}

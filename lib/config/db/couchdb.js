module.exports = couchDbConfig
module.exports.internals = {
  checkVendor: checkVendor,
  getAdmins: getAdmins,
  getConfig: getConfig,
  setConfig: setConfig
}

var _ = require('lodash')
var async = require('async')
var log = require('npmlog')
var request = require('request')

var internals = module.exports.internals

function couchDbConfig (state, callback) {
  var couch = request.defaults({
    baseUrl: state.config.db.url,
    json: true
  })

  async.series([
    async.apply(internals.checkVendor, state.config, couch),
    async.apply(internals.setConfig, couch),
    async.apply(internals.getConfig, couch),
    async.apply(internals.getAdmins, couch)
  ], function (err, results) {
    if (err) return callback(err)

    state.config.db.admins = results[3]
    state.config.db.secret = results[2].secret
    state.config.db.authenticationDb = results[2].authentication_db

    callback(null, state.config)
  })
}

function checkVendor (config, couch, callback) {
  couch({url: '/'}, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not find CouchDB at ' + config.db.url))
    }

    var vendor = _.findKey(data, function (prop) {
      return /^welcome/i.test(prop)
    })

    if (vendor !== 'couchdb') {
      log.warn(
        'database',
        'You are not running an official CouchDB distribution, ' +
        'but "' + vendor + '". ' +
        'This might not be fully supported. Proceed at your own risk.'
      )
    }

    callback(null)
  })
}

function setConfig (couch, callback) {
  couch({
    url: '/_config/httpd/authentication_handlers',
    method: 'PUT',
    body: '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}'
  }, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not set necessary CouchDB config'))
    }

    callback(null)
  })
}

function getConfig (couch, callback) {
  couch({
    url: '/_config/couch_httpd_auth'
  }, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not retrieve necessary CouchDB config values'))
    }

    if (!data.secret) {
      return callback(new Error('Could not retrieve CouchDB secret'))
    }

    if (!data.authentication_db) {
      return callback(new Error('Could not retrieve CouchDB authentication database'))
    }

    callback(null, _.pick(data, ['secret', 'authentication_db']))
  })
}

function getAdmins (couch, callback) {
  couch({
    url: '/_config/admins'
  }, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not retrieve CouchDB admins'))
    }

    callback(null, data)
  })
}

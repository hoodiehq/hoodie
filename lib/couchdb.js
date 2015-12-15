var existsSync = require('fs').existsSync
var join = require('path').join

var _ = require('lodash')
var async = require('async')
var jsonfile = require('jsonfile')
var log = require('npmlog')
var randomstring = require('randomstring')
var request = require('request')

var exports = module.exports = function (config, callback) {
  if (!config.db.url) return async.asyncify(exports.generatedConfig)(config, callback)

  var couch = request.defaults({
    baseUrl: config.db.url,
    json: true
  })

  async.waterfall([
    async.apply(exports.checkVendor, config, couch),
    async.apply(exports.setConfig, couch),
    async.apply(exports.getConfig, couch)
  ], callback)
}

exports.generatedConfig = function generatedConfig (config) {
  var storePath = join(config.paths.data, 'config.json')
  var storeExists = existsSync(storePath)
  var store = storeExists && jsonfile.readFileSync(storePath, {
    throws: false
  }) || {}
  var secret = store.couch_httpd_auth_secret

  if (!secret) {
    secret = randomstring.generate({
      charset: 'hex'
    })
    jsonfile.writeFileSync(storePath, Object.assign(store, {
      couch_httpd_auth_secret: secret
    }), {spaces: 2})
  }

  return {
    secret: secret,
    authentication_db: '_users'
  }
}

exports.checkVendor = function checkVendor (config, couch, callback) {
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

exports.setConfig = function setConfig (couch, callback) {
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

exports.getConfig = function getConfig (couch, callback) {
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

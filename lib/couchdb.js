module.exports = getCouchDbConfig
module.exports.internals = {
  checkVendor: checkVendor,
  generatedConfig: generatedConfig,
  getAdmins: getAdmins,
  getConfig: getConfig,
  setConfig: setConfig
}

var existsSync = require('fs').existsSync
var join = require('path').join

var _ = require('lodash')
var async = require('async')
var jsonfile = require('jsonfile')
var log = require('npmlog')
var randomstring = require('randomstring')
var request = require('request')

var internals = module.exports.internals

function getCouchDbConfig (config, callback) {
  if (!config.db.url) {
    return async.asyncify(internals.generatedConfig)(config, callback)
  }

  var couch = request.defaults({
    baseUrl: config.db.url,
    json: true
  })

  async.series([
    async.apply(internals.checkVendor, config, couch),
    async.apply(internals.setConfig, couch),
    async.apply(internals.getConfig, couch),
    async.apply(internals.getAdmins, couch)
  ], function (err, results) {
    if (err) return callback(err)

    callback(null, _.assign({
      admins: results[3]
    }, results[2]))
  })
}

function generatedConfig (config) {
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
    authentication_db: '_users',
    admins: {}
  }
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

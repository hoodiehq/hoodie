module.exports = couchDbConfig

var checkVendor = require('./couchdb-check-vendor')
var getAdmins = require('./couchdb-get-admins')
var getConfig = require('./couchdb-get-config')
var setConfig = require('./couchdb-set-config')

var async = require('async')
var request = require('request')

function couchDbConfig (state, callback) {
  var couch = request.defaults({
    baseUrl: state.config.db.url,
    json: true
  })

  async.series([
    async.apply(checkVendor, state.config, couch),
    async.apply(setConfig, couch),
    async.apply(getConfig, couch),
    async.apply(getAdmins, couch)
  ], function (err, results) {
    if (err) return callback(err)

    state.config.db.admins = results[3]
    state.config.db.secret = results[2].secret
    state.config.db.authenticationDb = results[2].authentication_db

    callback(null, state.config)
  })
}

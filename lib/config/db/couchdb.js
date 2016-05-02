module.exports = couchDbConfig
module.exports.internals = {
  checkVendor: require('./couchdb-check-vendor'),
  getAdmins: require('./couchdb-get-admins'),
  getConfig: require('./couchdb-get-config'),
  setConfig: require('./couchdb-set-config')
}

var async = require('async')
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

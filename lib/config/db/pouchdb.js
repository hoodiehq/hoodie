module.exports = pouchDbConfig

var existsSync = require('fs').existsSync
var join = require('path').join
var jsonfile = require('jsonfile')
var randomstring = require('randomstring')

function pouchDbConfig (config, callback) {
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

  callback(null, {
    secret: secret,
    authentication_db: '_users',
    admins: {}
  })
}

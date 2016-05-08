module.exports = pouchDbConfig

var existsSync = require('fs').existsSync
var join = require('path').join

var jsonfile = require('jsonfile')
var randomstring = require('randomstring')

function pouchDbConfig (state, callback) {
  var storePath = join(state.config.paths.data, 'config.json')
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

  state.config.db.secret = secret
  state.config.db.admins = {}
  state.config.db.authenticationDb = '_users'

  callback(null, state.config)
}

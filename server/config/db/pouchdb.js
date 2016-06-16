module.exports = pouchDbConfig

var existsSync = require('fs').existsSync
var join = require('path').join

// pouchdb-admins is made to be a PouchDB plugin but does not require a db,
// so can be used standalone
var Admins = require('pouchdb-admins').admins
var get = require('lodash/get')
var jsonfile = require('jsonfile')
var randomstring = require('randomstring')

function pouchDbConfig (state, callback) {
  var storePath = join(state.config.paths.data, 'config.json')
  var storeExists = existsSync(storePath)

  var store = storeExists && jsonfile.readFileSync(storePath, {
    throws: false
  }) || {}
  var secret = store.couch_httpd_auth_secret
  var adminPassword = get(store, 'admins.admin')

  if (!secret) {
    secret = randomstring.generate({
      charset: 'hex'
    })

    if (!state.config.inMemory && adminPassword) {
      jsonfile.writeFileSync(storePath, Object.assign(store, {
        couch_httpd_auth_secret: secret
      }), {spaces: 2})
    }
  }

  state.config.db.secret = secret
  state.config.db.admins = store.admins
  state.config.db.authenticationDb = '_users'

  if (adminPassword) {
    return callback(null, state.config)
  }

  var admins = new Admins({
    secret: secret
  })

  admins.set('admin', 'secret')

  .then(function () {
    return admins.get('admin')
  })

  .then(function (doc) {
    state.config.db.admins = {
      admin: '-pbkdf2-' + doc.derived_key + ',' + doc.salt + ',10'
    }

    if (!state.config.inMemory) {
      jsonfile.writeFileSync(storePath, Object.assign(store, {
        couch_httpd_auth_secret: secret,
        admins: state.config.db.admins
      }), {spaces: 2})
    }

    callback(null, state.config)
  })

  .catch(function (error) {
    callback(error)
  })
}

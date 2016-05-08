module.exports = storeConfig

var removeAuth = require('../../utils/remove-auth-from-url')
var storePreAuthHook = require('./pre-auth-hook')

function storeConfig (state, callback) {
  state.config.store.hooks = {
    onPreAuth: storePreAuthHook
  }

  if (state.config.db.url) {
    state.config.store.couchdb = removeAuth(state.config.db.url)
  } else {
    state.config.store.PouchDB = state.getDatabase.PouchDB
  }

  callback(null, state.config)
}

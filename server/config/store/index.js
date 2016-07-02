module.exports = storeConfig

var stripUrlAuth = require('strip-url-auth')

var storePreAuthHook = require('./pre-auth-hook')

function storeConfig (state, callback) {
  state.config.store.hooks = {
    onPreAuth: storePreAuthHook
  }

  if (state.config.db.url) {
    state.config.store.couchdb = stripUrlAuth(state.config.db.url)
  } else {
    state.config.store.PouchDB = state.getDatabase.PouchDB
  }

  callback(null, state.config)
}

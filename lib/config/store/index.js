module.exports = storeConfig

var removeAuth = require('../../utils/remove-auth-from-url')

function storeConfig (state, callback) {
  if (state.config.db.url) {
    state.config.store.couchdb = removeAuth(state.config.db.url)
  } else {
    state.config.store.PouchDB = state.getDatabase.PouchDB.constructor
  }

  callback(null, state.config)
}

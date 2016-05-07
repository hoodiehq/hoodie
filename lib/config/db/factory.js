module.exports = getDatabaseFactory

var url = require('url')

function getDatabaseFactory (config) {
  var PouchDB = require('pouchdb').defaults(config.db)
  var db = function getDatabase (name) {
    if (config.db.url) {
      return new PouchDB(url.resolve(config.db.url, encodeURIComponent(name)))
    }
    return new PouchDB(name)
  }
  db.PouchDB = PouchDB
  return db
}

module.exports = getDatabase

var url = require('url')

function getDatabase (config) {
  var PouchDB = require('pouchdb').defaults(config.db)
  var db = function (name) {
    if (config.db.url) {
      return new PouchDB(url.resolve(config.db.url, encodeURIComponent(name)))
    }
    return new PouchDB(name)
  }
  db.PouchDB = PouchDB
  return db
}

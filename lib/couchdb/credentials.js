var fs = require('fs')
var path = require('path')

var cache

exports.get = function (data_path) {
  if (cache && cache.couchdb) return cache.couchdb

  try {
    return JSON.parse(fs.readFileSync(exports.path(data_path), 'utf8')).couchdb
  } catch (e) {
    return {}
  }
}

exports.set = function (data_path, username, password) {
  cache = {
    couchdb: {
      username: username,
      password: password
    }
  }

  fs.writeFileSync(exports.path(data_path), JSON.stringify(cache, null, 2))
}

exports.path = function (data_path) {
  return path.resolve(data_path, 'config.json')
}

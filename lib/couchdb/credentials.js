var fs = require('fs')
var path = require('path')

exports.get = function (data_path) {
  try {
    return JSON.parse(fs.readFileSync(exports.path(data_path), 'utf8')).couchdb
  } catch (e) {
    return {}
  }
}

exports.set = function (data_path, username, password) {
  fs.writeFileSync(exports.path(data_path), JSON.stringify({
    couchdb: {
      username: username,
      password: password
    }
  }, null, 2))
}

exports.path = function (data_path) {
  return path.resolve(data_path, 'config.json')
}

module.exports = assureFolders

var path = require('path')
var mkdirp = require('mkdirp')
var parallel = require('async').parallel

function assureFolders (options, callback) {
  if (options.inMemory) {
    return callback()
  }

  var tasks = [
    mkdirp.bind(null, options.data)
  ]

  if (!options.dbUrl) {
    var storeFilesPath = path.join(options.data, 'data') + path.sep
    tasks.push(mkdirp.bind(null, storeFilesPath))
  }

  parallel(tasks, callback)
}

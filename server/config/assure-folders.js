module.exports = assureFolders

var parallel = require('async').parallel
var mkdirp = require('mkdirp')

function assureFolders (state, callback) {
  if (state.config.inMemory) {
    return callback()
  }

  var tasks = [
    mkdirp.bind(null, state.config.paths.data)
  ]
  if (state.config.db.prefix) {
    tasks.push(mkdirp.bind(null, state.config.db.prefix))
  }

  parallel(tasks, callback)
}

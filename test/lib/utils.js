var child_process = require('child_process')
var path = require('path')

var rimraf = require('rimraf')

exports.killCouch = function (data_dir, callback) {
  var cmd = 'pkill -f ' + data_dir
  child_process.exec(cmd, function (er, stdout, stderr) {
    // ignore errors
    callback()
  })
}

exports.resetFixture = function (dir, callback) {
  var data_dir = path.resolve(dir, 'data')
  rimraf(data_dir, function (err) {
    if (err) {
      return callback(err)
    }

    exports.killCouch(data_dir, callback)
  })
}

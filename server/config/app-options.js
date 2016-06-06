module.exports = getAppOptions

var join = require('path').join

function getAppOptions () {
  var projectPath = process.cwd()
  var pkg = require(join(projectPath, 'package.json'))
  var appOptions = pkg.hoodie || {}

  appOptions.name = pkg.name

  return appOptions
}

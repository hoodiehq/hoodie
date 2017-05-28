module.exports = getAppDefaults

var join = require('path').join

function getAppDefaults (projectPath) {
  var pkg = require(join(projectPath, 'package.json'))
  var appOptions = pkg.hoodie || {}

  if (!appOptions.name) {
    appOptions.name = pkg.name
  }

  return appOptions
}

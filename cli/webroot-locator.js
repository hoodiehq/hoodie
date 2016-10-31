module.exports = locateWebroot

var fs = require('fs')
var pathModule = require('path')

function locateWebroot (path) {
  if (fs.existsSync(path) && fs.statSync(path).isDirectory()) {
    return path
  }

  return pathModule.resolve(__dirname, '../public')
}

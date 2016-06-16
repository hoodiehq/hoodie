module.exports = bundleClient

var fs = require('fs')

function bundleClient (hoodieClientPath, config, callback) {
  fs.readFile(hoodieClientPath, function (error, clientBuffer) {
    if (error) {
      return callback(error)
    }

    var options = config.client ? JSON.stringify(config.client) : ''
    var initBuffer = Buffer('\n\nhoodie = new Hoodie(' + options + ')')

    callback(null, Buffer.concat([clientBuffer, initBuffer]))
  })
}

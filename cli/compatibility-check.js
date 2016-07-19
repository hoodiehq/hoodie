module.exports = compatibilityCheck

var semver = require('semver')

function compatibilityCheck (callback) {
  if (semver.lt(process.versions.node, '4.0.0')) {
    return callback(new Error('A node version >=4 is required to run Hoodie'))
  }

  callback(null)
}

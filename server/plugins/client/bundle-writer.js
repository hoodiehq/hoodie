module.exports = writeClientBundle

var fs = require('fs')

var log = require('npmlog')

function writeClientBundle (hasUpdate, inMemory, bundleTargetPath, bundleBuffer) {
  if (!hasUpdate) {
    log.info('client', 'bundle is up to date')
    return
  }

  if (inMemory) {
    log.silly('client', 'running in memory, not writing bundle to ' + bundleTargetPath)
    return
  }

  log.info('client', 'bundle is out of date')
  log.silly('client', 'writing bundle to ' + bundleTargetPath)
  fs.writeFile(bundleTargetPath, bundleBuffer, function (error) {
    if (error) {
      log.warn('client', 'could not write to ' + bundleTargetPath + '. Bundle cannot be cached and will be re-generated on server restart')
      return
    }

    log.info('client', 'bundle written to ' + bundleTargetPath)
  })
}

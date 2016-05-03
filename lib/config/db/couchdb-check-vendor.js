module.exports = checkVendor

var findKey = require('lodash').findKey
var log = require('npmlog')

function checkVendor (config, couch, callback) {
  couch({url: '/'}, function (error, response, data) {
    if (error || (response && response.statusCode !== 200)) {
      return callback(new Error('Could not find CouchDB at ' + config.db.url))
    }

    var vendor = findKey(data, function (property) {
      return /^welcome/i.test(property)
    })

    if (vendor !== 'couchdb') {
      log.warn(
        'database',
        'You are not running an official CouchDB distribution, ' +
        'but "' + vendor + '". ' +
        'This might not be fully supported. Proceed at your own risk.'
      )
    }

    callback(null)
  })
}

module.exports = checkVendor

var findKey = require('lodash').findKey
var log = require('npmlog')

function checkVendor (config, couch, callback) {
  couch({url: '/'}, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not find CouchDB at ' + config.db.url))
    }

    var vendor = findKey(data, function (prop) {
      return /^welcome/i.test(prop)
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

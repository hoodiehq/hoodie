module.exports = getConfig

var pick = require('lodash').pick

function getConfig (couch, callback) {
  couch({
    url: '/_config/couch_httpd_auth'
  }, function (error, response, data) {
    if (error || (response && response.statusCode !== 200)) {
      return callback(new Error('Could not retrieve necessary CouchDB config values'))
    }

    if (!data.secret) {
      return callback(new Error('Could not retrieve CouchDB secret'))
    }

    if (!data.authentication_db) {
      return callback(new Error('Could not retrieve CouchDB authentication database'))
    }

    callback(null, pick(data, ['secret', 'authentication_db']))
  })
}

module.exports = getAdmins

function getAdmins (couch, callback) {
  couch({
    url: '/_config/admins'
  }, function (error, response, data) {
    if (error || (response && response.statusCode !== 200)) {
      return callback(new Error('Could not retrieve CouchDB admins'))
    }

    callback(null, data)
  })
}

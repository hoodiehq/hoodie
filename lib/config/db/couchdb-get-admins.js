module.exports = getAdmins

function getAdmins (couch, callback) {
  couch({
    url: '/_config/admins'
  }, function (err, res, data) {
    if (err || (res && res.statusCode !== 200)) {
      return callback(new Error('Could not retrieve CouchDB admins'))
    }

    callback(null, data)
  })
}

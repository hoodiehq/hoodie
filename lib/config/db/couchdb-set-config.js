module.exports = setConfig

function setConfig (couch, callback) {
  couch({
    url: '/_config/httpd/authentication_handlers',
    method: 'PUT',
    body: '{couch_httpd_oauth, oauth_authentication_handler},{couch_httpd_auth, default_authentication_handler},{couch_httpd_auth, cookie_authentication_handler}'
  }, function (error, response, data) {
    if (error || (response && response.statusCode !== 200)) {
      return callback(new Error('Could not set necessary CouchDB config'))
    }

    callback(null)
  })
}

var url = require('url')

var _ = require('lodash')
var Wreck = require('wreck')

module.exports = {
  addCorsAndBearerToken: function (err, res, request, reply) {
    if (err) return reply(err).code(500)

    Wreck.read(res, {
      json: true
    }, function (err, data) {
      if (err) return reply(err).code(500)

      if (data &&
        request.method === 'post' &&
        request.path === '/hoodie/_session' &&
        Array.isArray(res.headers['set-cookie'])) {
        var result = /AuthSession=(.*?);/.exec(res.headers['set-cookie'][0])
        if (result && result.length > 1) {
          data.bearerToken = result[1]
        }
        delete res.headers['set-cookie']
      }

      var resp = reply(data).code(res.statusCode).hold()
      resp.headers = res.headers
      resp.send()
    })
  },
  mapProxyPath: function (db, request, callback) {
    // use the bearer token as the cookie AuthSession for couchdb:
    delete request.headers.cookie
    if (request.headers.authorization && request.headers.authorization.substring(0, 'Bearer '.length) === 'Bearer ') {
      request.headers.cookie = 'AuthSession=' + request.headers.authorization.substring('Bearer '.length)
    }

    // TODO: This is just a temporary fix for PouchDB
    delete request.headers['accept-encoding']
    request.headers.host = [db.hostname, db.port].join(':')
    callback(null, url.resolve(url.format(_.omit(db, 'auth')), request.url.path.substr('/hoodie'.length)), request.headers)
  }
}

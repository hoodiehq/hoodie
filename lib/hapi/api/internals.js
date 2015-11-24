var url = require('url')

var _ = require('lodash')
var Wreck = require('wreck')

module.exports = {
  addCorsAndBearerToken: function (err, res, request, reply) {
    if (err) return reply(err).code(500)

    Wreck.read(res, {
      json: true
    }, function (err, data) {
      var allowedHeaders = [
        'authorization',
        'content-length',
        'content-type',
        'if-match',
        'if-none-match',
        'origin',
        'x-requested-with'
      ]

      function addAllowedHeaders (arr) {
        for (var i = 0; i < arr.length; i++) {
          if (allowedHeaders.indexOf(arr[i].trim().toLowerCase()) === -1) {
            allowedHeaders.push(arr[i].trim().toLowerCase())
          }
        }
      }

      if (err) return reply(err).code(500)

      var isSess = request.method === 'post' && request.path === '/hoodie/_session'

      if (data && isSess && Array.isArray(res.headers['set-cookie'])) {
        var result = /AuthSession=(.*?);/.exec(res.headers['set-cookie'][0])
        if (result && result.length > 1) {
          data.bearerToken = result[1]
        }
        delete res.headers['set-cookie']
      }

      addAllowedHeaders(Object.keys(request.headers))

      if (request.method === 'options') {
        res.statusCode = 200

        if (request.headers['Allow-Control-Request-Headers']) {
          addAllowedHeaders(request.headers['Allow-Control-Request-Headers'].split(','))
        }
      }

      var resp = reply(data).code(res.statusCode).hold()
      resp.headers = res.headers
      resp.headers['content-length'] = data ? data.length : 0
      resp.headers['access-control-allow-origin'] = request.headers.origin || '*'
      resp.headers['access-control-allow-headers'] = allowedHeaders.join(', ')
      resp.headers['access-control-expose-headers'] = 'content-type, content-length, etag'
      resp.headers['access-control-allow-methods'] = 'GET, PUT, POST, DELETE'
      resp.headers['access-control-allow-credentials'] = 'true'
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

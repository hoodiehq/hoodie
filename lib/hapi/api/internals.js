var url = require('url')

var _ = require('lodash')
var Wreck = require('wreck')

module.exports = {
  addCorsAndBearerToken: function (err, res, request, reply) {
    if (err) {
      reply(err).code(500)
      return
    }

    Wreck.read(res, {
      json: true
    }, function (err, data) {
      var resp
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

      if (err) {
        reply(err).code(500)
        return
      }

      var isSess = request.method === 'post' && request.path === '/hoodie/_session'

      if (data && isSess && Array.isArray(res.headers['set-cookie'])) {
        data.bearerToken = extractToken(res.headers['set-cookie'])
        delete res.headers['set-cookie']
      }

      addAllowedHeaders(Object.keys(request.headers))

      if (request.method === 'options') {
        res.statusCode = 200

        if (request.headers['Allow-Control-Request-Headers']) {
          addAllowedHeaders(request.headers['Allow-Control-Request-Headers'].split(','))
        }
      }

      // hapi eats newlines. We like newlines. For POSIX and such.
      // data = data + '\n'
      resp = reply(data).code(res.statusCode).hold()
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
  extractToken: extractToken,
  mapProxyPath: function (db, request, callback) {
    // use the bearer token as the cookie AuthSession for couchdb:
    if (request.headers.authorization && request.headers.authorization.substring(0, 'Bearer '.length) === 'Bearer ') {
      request.headers.cookie = 'AuthSession=' + request.headers.authorization.substring('Bearer '.length)
    } else {
      delete request.headers.cookie
    }
    // TODO: This is just a temporary fix for PouchDB
    delete request.headers['accept-encoding']
    request.headers.host = [db.hostname, db.port].join(':')
    callback(null, url.resolve(url.format(_.omit(db, 'auth')), request.url.path.substr('/hoodie'.length)), request.headers)
  },
  notFound: notFound
}

function extractToken (cookieHeader) {
  var result = /AuthSession=(.*?);/.exec(cookieHeader[0])
  if (result && result.length > 1) {
    return result[1]
  }
}

function notFound (request, reply) {
  reply({
    'error': 'not found'
  }).code(404)
}

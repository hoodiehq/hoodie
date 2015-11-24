var path = require('path')
var url = require('url')

var _ = require('lodash')
var Wreck = require('wreck')

exports.register = register
exports.register.attributes = {
  name: 'api',
  dependencies: 'h2o2'
}

var clientPath = path.dirname(require.resolve('hoodie-client/package.json'))

function register (server, options, next) {
  // allow clients to request a gzip response, even if the
  // Accept-Encoding headers is missing or mangled due to
  // faulty proxy servers
  // http://www.stevesouders.com/blog/2010/07/12/velocity-forcing-gzip-compression/
  server.ext('onPreHandler', function maybeForceGzip (request, reply) {
    if (request.query.force_gzip === 'true') {
      request.info.acceptEncoding = 'gzip'
    }
    reply.continue()
  })

  server.route([{
    method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    path: '/hoodie/{p*}',
    handler: {
      proxy: {
        passThrough: true,
        mapUri: exports.mapProxyPath.bind(null, options.app.db),
        onResponse: exports.addBearerToken
      }
    }
  }, {
    method: 'GET',
    path: '/hoodie/_all_dbs',
    handler: function (request, reply) {
      reply({error: 'not found'}).code(404)
    }
  }, {
    method: 'GET',
    path: '/hoodie/bundle.js',
    handler: {
      file: path.join(clientPath, 'dist/hoodie.js')
    }
  }, {
    method: 'GET',
    path: '/hoodie/bundle.min.js',
    handler: {
      file: path.join(clientPath, 'dist/hoodie.min.js')
    }
  }])

  return next()
}

exports.addBearerToken = function (err, res, request, reply) {
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
}

exports.mapProxyPath = function (db, request, callback) {
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

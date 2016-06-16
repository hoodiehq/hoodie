module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-maybe-force-gzip'
}

// allow clients to request a gzip response, even if the
// Accept-Encoding headers is missing or mangled due to
// faulty proxy servers
// http://www.stevesouders.com/blog/2010/07/12/velocity-forcing-gzip-compression/
function register (server, options, next) {
  server.ext('onPreHandler', function maybeForceGzip (request, reply) {
    if (request.query.force_gzip === 'true') {
      request.info.acceptEncoding = 'gzip'
    }
    reply.continue()
  })

  next()
}

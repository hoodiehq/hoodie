module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-repl'
}

var log = require('npmlog')
var AdminClient = require('@hoodie/admin-client')

function register (server, options, next) {
  if (process.argv[2] !== 'console') return next()

  var port = options.replPort || 9000

  console.log('Hoodie REPL available on port ' + port)
  console.log('Type \'.exit\' in the REPL to exit')

  server.register({
    register: require('reptile'),
    options: {
      context: new AdminClient(),
      port: port,
      replOptions: {
        prompt: 'hoodie > '
      }
    }
  }, function (error) {
    if (error) log.error('repl', error)
    return next()
  })
}


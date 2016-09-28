module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-repl'
}

var Net = require('net')
var AdminClient = require('@hoodie/admin-client')

var availablePort = function (callback) {
  var server = Net.createServer()
  server.listen(0, () => {
    var port = server.address().port
    server.close(() => {
      callback(port)
    })
  })
}

function register (server, options, next) {
  if (process.argv[2] !== 'console') return next()

  availablePort(function (portAvailable) {
    var port = options.replPort || portAvailable

    console.log('Hoodie REPL available on port ' + port)

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
      if (error) console.log(error)
      return next()
    })
  })
}


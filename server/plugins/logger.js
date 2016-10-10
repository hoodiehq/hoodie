module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie-local-logger'
}

var path = require('path')

function register (server, options, next) {
  server.register({
    register: require('good'),
    options: {
      ops: {
        interval: 30000
      },
      reporters: {
        hoodieReporter: [
          {
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [
              {
                ops: '*',
                response: '*',
                log: '*',
                error: '*',
                request: '*'
              }
            ]
          },
          {
            module: path.join(__dirname, 'good-hoodie')
          }
        ]
      }
    }
  }, next)
}

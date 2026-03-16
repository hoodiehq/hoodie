module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie'
}

var corsHeaders = require('hapi-cors-headers')
var hoodieServer = require('@hoodie/server').register

var registerPlugins = require('./plugins')

function register (server, options, next) {
  options = Object.assign({}, options)
  options.paths = Object.assign({
    public: 'public'
  }, options.paths)
  options.plugins = options.plugins || []
  options.app = options.app || {}

  server.ext('onPreResponse', corsHeaders)

  server.register({ register: hoodieServer, options: options }, function (error) {
    if (error) {
      return next(error)
    }

    registerPlugins(server, options, function (error) {
      if (error) {
        return next(error)
      }

      next(null, server, options)
    })
  })
}

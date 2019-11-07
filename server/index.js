module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie'
}

var corsHeaders = require('hapi-cors-headers')
var hoodieServer = require('@hoodie/server').register
var _ = require('lodash')

var registerPlugins = require('./plugins')

function register (server, options, next) {
  options = _.cloneDeep(options)
  _.defaultsDeep(options, {
    paths: {
      public: 'public'
    },
    plugins: [],
    app: {}
  })

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

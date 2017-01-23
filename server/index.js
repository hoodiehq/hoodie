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
    }
  })

  server.ext('onPreResponse', corsHeaders)

  registerPlugins(server, options, function (error) {
    if (error) {
      return next(error)
    }
    server.register({
      register: hoodieServer,
      options: options
    }, function (error) {
      if (error) {
        return next(error)
      }

      // we register a router handler for /hoodie/* which must be registered
      // after all other plugins, otherwise routes like /hoodie/account/api/*
      // will be handled by the public route handler
      server.register({
        register: require('./plugins/public'),
        options: {
          config: options
        }
      }, function (error) {
        /* istanbul ignore next */
        if (error) {
          return next(error)
        }

        next(null, server, options)
      })
    })
  })
}

module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie'
}

const corsHeaders = require('hapi-cors-headers')
const hoodieServer = require('@hoodie/server').register
const lod = require('lodash')

let registerPlugins = require('./plugins')

function register (server, options, next) {
  options = lod.cloneDeep(options)
  lod.defaultsDeep(options, {
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

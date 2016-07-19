module.exports.register = register
module.exports.register.attributes = {
  name: 'hoodie'
}

var corsHeaders = require('hapi-cors-headers')

var getConfig = require('./config')
var registerPlugins = require('./plugins')
var userDatabases = require('./utils/user-databases')

function register (server, options, next) {
  getConfig(options, function (error, config) {
    if (error) {
      return next(error)
    }

    server.ext('onPreResponse', corsHeaders, {
      sandbox: 'plugin'
    })

    registerPlugins(server, config, function (error) {
      if (error) {
        return next(error)
      }

      // add / remove user databases on signups / account deletions
      server.plugins.account.api.accounts.on('add', userDatabases.add.bind(null, config, server))
      server.plugins.account.api.accounts.on('remove', userDatabases.remove.bind(null, config, server))

      next(null, server, config)
    })
  })
}

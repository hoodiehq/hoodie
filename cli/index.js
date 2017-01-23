module.exports = run

var log = require('npmlog')
var Hapi = require('hapi')

var assureFolders = require('./assure-folders')
var compatibilityCheck = require('./compatibility-check.js')
var getOptions = require('./options')
var getHapiOptions = require('./hapi-options')
var parseOptions = require('./parse-options')

var hoodie = require('../server').register

function run (callback) {
  compatibilityCheck(function (error) {
    if (error) {
      log.error('env', error.message)
      return callback(error)
    }

    var projectPath = process.cwd()
    var options = getOptions(projectPath)

    log.level = options.loglevel
    log.verbose('app', 'Initialising')

    assureFolders(options, function (error) {
      if (error) {
        log.error('app', error.message)
        return callback(error)
      }

      var hapiOptions = getHapiOptions(options)
      var server = new Hapi.Server(hapiOptions.server)
      server.connection(hapiOptions.connection)

      server.register({
        register: hoodie,
        options: parseOptions(options)
      }, function (error) {
        if (error) {
          return callback(error)
        }

        server.start(function (error) {
          callback(error, server)
        })
      })
    })
  })
}

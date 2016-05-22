module.exports = parseOptions

var path = require('path')

var _ = require('lodash')
var log = require('npmlog')

var getDefaults = require('./defaults')
var removeAuth = require('../utils/remove-auth-from-url')

function parseOptions (options, callback) {
  // ensure we have all required options
  _.defaults(options, {
    plugins: {}
  })

  // collect options from package.json
  var packagePath = path.join(process.cwd(), 'package.json')
  try {
    var pkg = require(packagePath)
    _.defaultsDeep(pkg, {
      hoodie: {
        plugins: {}
      }
    })
  } catch (e) {
    log.warn('No package.json at ' + packagePath)
  }

  // we only want to "enable" plugins specified in package.json
  // plugin options can be added or overridden in .hoodierc
  var plugins = Object.keys(pkg.hoodie.plugins).reduce(function (pluginsMap, pluginName) {
    var plugin = pkg.hoodie.plugins[pluginName]
    if (typeof plugin === 'string') {
      plugin = {
        name: plugin
      }
    }

    _.defaultsDeep(plugin, {
      name: pluginName,
      package: 'hoodie-plugin-' + pluginName,
      routes: {},
      options: {}
    })

    if (options.plugins.hasOwnProperty(plugin.name)) {
      _.assign(plugin.options, options.plugins[plugin.name])
    }

    pluginsMap[plugin.name] = plugin

    return pluginsMap
  }, {})

  // construct final config
  var config = {
    loglevel: options.loglevel,
    paths: {
      data: options.data,
      public: options.public
    },
    connection: {
      host: options.bindAddress,
      port: options.port
    },
    plugins: plugins
  }

  // apply config defaults
  _.defaultsDeep(config, getDefaults())

  log.level = config.loglevel

  if (options.dbUrl) {
    config.db.url = options.dbUrl
    log.info('config', 'Connecting to CouchDB at ' + removeAuth(options.dbUrl))
  } else {
    if (options.inMemory) {
      log.info('config', 'Storing all data in memory only')
      config.db.db = require('memdown')
    } else {
      config.db.prefix = path.join(config.paths.data, 'data' + path.sep)
      log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
      log.info('config', 'Writing PouchDB database files to ' + config.db.prefix)
    }
  }

  return config
}

module.exports = getCliOptions

var fs = require('fs')
var path = require('path')

var log = require('npmlog')
var pick = require('lodash').pick
var rc = require('rc')
var yargs = require('yargs')

var getAppDefaults = require('./app-defaults')
var getHoodieDefaults = require('./hoodie-defaults')
var webrootLocator = require('./webroot-locator')

function getCliOptions (projectPath) {
  var hoodieDefaults = getHoodieDefaults()
  var appDefaults = getAppDefaults(projectPath)

  // Order of defaults
  //
  // 1. Hoodie defaults
  // 2. App defaults
  // 3. rc (https://www.npmjs.com/package/rc) – note we don’t read CLI through rc
  var defaults = rc('hoodie', hoodieDefaults, appDefaults)

  var options = yargs
    .options({
      loglevel: {
        choices: [
          'silly',
          'verbose',
          'info',
          'http',
          'warn',
          'error',
          'silent'
        ],
        default: defaults.loglevel
      },
      port: {
        type: 'number',
        default: defaults.port,
        describe: 'Port-number to run the Hoodie App on'
      },
      address: {
        type: 'string',
        default: defaults.address,
        describe: 'Address to which Hoodie binds'
      },
      bindAddress: {
        type: 'string',
        describe: '[DEPRECATED] Address to which Hoodie binds (see --address)'
      },
      data: {
        type: 'string',
        default: defaults.data,
        describe: 'Data path'
      },
      public: {
        type: 'string',
        default: defaults.public,
        describe: 'Path to static assets'
      },
      m: {
        alias: 'in-memory',
        type: 'boolean',
        default: defaults.inMemory,
        describe: 'Whether to start the PouchDB Server in memory'
      },
      dbUrl: {
        type: 'string',
        default: defaults.dbUrl,
        describe: 'If provided, uses external CouchDB. (Can contain auth credentials)'
      },
      dbUrlPassword: {
        type: 'string',
        default: defaults.dbUrlPassword,
        describe: 'Provides the password for auth with the db at dbUrl (requires dbUrl and/or dbUrlUsername)'
      },
      dbUrlUsername: {
        type: 'string',
        default: defaults.dbUrlUsername,
        describe: 'Provides the username for auth with the db at dbUrl (requires dbUrl and dbUrlPassword)'
      },
      dbAdapter: {
        type: 'string',
        default: defaults.dbAdapter,
        describe: 'Default PouchDB Adapter (https://pouchdb.com/adapters.html).'
      },
      url: {
        type: 'string',
        default: defaults.url,
        describe: 'URL at which Hoodie Server is accessible (e.g. http://myhoodieapp.com)'
      },
      adminPassword: {
        type: 'string',
        default: defaults.adminPassword,
        describe: 'Password to login to Admin Dashboard. Login is not possible unless set.'
      }
    })
    .help('h', 'Show this help message')
    .alias('h', 'help')
    .alias('h', 'usage')
    .showHelpOnFail(false, 'Specify --help for available options')
    .version(function () {
      try {
        var pkg = require('../package.json')
        console.log(pkg.version, '\n')
        process.exit(0)
      } catch (e) {
        process.exit(1)
      }
    })
    .alias('v', 'version')
    .env('hoodie')
    .epilogue('Options can also be specified as environment variables (prefixed with "hoodie_") or inside a ".hoodierc" file (json or ini).')
    .wrap(Math.min(150, yargs.terminalWidth()))
    .argv

  if (options.bindAddress) {
    log.warn('The use of --bindAddress is deprecated. Use the --address option instead.')
    options.address = options.bindAddress
  }

  options.name = defaults.name
  options.public = webrootLocator(options.public)
  options.plugins = defaults.plugins
  options.app = defaults.app
  options.client = defaults.client
  options.account = defaults.account
  options.store = defaults.store

  // If app has a hoodie folder, add it to the list of plugins
  if (fs.existsSync(path.join(projectPath, 'hoodie'))) {
    options.plugins.push(projectPath)
  }

  // rc & yargs are setting keys we are not interested in, like in-memory or _
  // so we only pick the relevant ones based on they keys of the default options.
  return pick(options, Object.keys(hoodieDefaults))
}

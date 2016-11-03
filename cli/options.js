module.exports = getCliOptions

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
        describe: 'If provided, uses external CouchDB. URL has to contain credentials.'
      },
      url: {
        type: 'string',
        default: defaults.url,
        describe: 'URL at which Hoodie Server is accessible (e.g. http://myhoodieapp.com)'
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

  options.public = webrootLocator(options.public)

  // rc & yargs are setting keys we are not interested in, like in-memory or _
  // so we only pick the relevant ones based on they keys of the default options.
  return pick(options, Object.keys(hoodieDefaults))
}

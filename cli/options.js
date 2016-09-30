module.exports = getCliOptions

var pick = require('lodash').pick
var rc = require('rc')
var yargs = require('yargs')

var getAppDefaults = require('./app-defaults')
var getHoodieDefaults = require('./hoodie-defaults')

function getCliOptions (projectPath) {
  var hoodieDefaults = getHoodieDefaults()
  var appDefaults = getAppDefaults(projectPath)

  // Order of defaults
  //
  // 1. Hoodie defaults
  // 2. App defaults
  // 3. rc (https://www.npmjs.com/package/rc) – note we don’t read CLI through rc
  var defaults = rc('hoodie', hoodieDefaults, appDefaults)

  var configOptions = {
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
    bindAddress: {
      type: 'string',
      default: defaults.bindAddress,
      describe: 'Address that Hoodie binds to'
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
  }

  var options = yargs
    .command('console', 'Execute a admin client repl in a server', function (yargs) {
      return yargs.option('console', { default: true }).options(configOptions)
    })
    .options(configOptions)
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

  // rc & yargs are setting keys we are not interested in, like in-memory or _
  // so we only pick the relevant ones based on they keys of the default options.
  return pick(options, Object.keys(hoodieDefaults))
}

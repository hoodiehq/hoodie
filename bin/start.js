#!/usr/bin/env node

var url = require('url')

var _ = require('lodash')
var emoji = require('node-emoji')
var log = require('npmlog')
var path = require('path')
var rc = require('rc')
var semver = require('semver')
var yargs = require('yargs')

var defaults = require('../server/config/defaults')()
var getHoodieServer = require('../server')

var useEmoji = process.platform === 'darwin'

log.style = {
  silly: {inverse: true, bold: true},
  verbose: {fg: 'brightBlue', bold: true},
  info: {fg: 'brightGreen', bold: true},
  http: {fg: 'brightGreen', bold: true},
  warn: {fg: 'brightYellow', bold: true},
  error: {fg: 'brightRed', bold: true},
  silent: undefined
}
log.prefixStyle = {fg: 'magenta'}
log.headingStyle = {}
log.disp = {
  silly: 'Sill',
  verbose: 'Verb',
  info: 'Info',
  http: 'HTTP',
  warn: 'Warn',
  error: 'Err!',
  silent: 'silent'
}
log.heading = (useEmoji ? emoji.get('dog') + '  ' : '') + 'Hoodie'

if (semver.lt(process.versions.node, '4.0.0')) {
  log.error('env', 'A node version >=4 is required to run Hoodie')
  process.exit(1)
}

var args = yargs
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
    default: function () {
      if ('s' in yargs.argv || 'ddd' in yargs.argv) return 'silly'
      if ('d' in yargs.argv) return 'info'
      if ('dd' in yargs.argv || 'verbose' in yargs.argv) return 'verbose'
      if ('silent' in yargs.argv) return 'silent'
      return 'warn'
    }
  },
  port: {
    type: 'number',
    default: defaults.connection.port,
    describe: 'Port-number to run the Hoodie App on'
  },
  'bind-address': {
    type: 'string',
    default: defaults.connection.host,
    describe: 'Address that Hoodie binds to'
  },
  public: {
    type: 'string',
    default: defaults.paths.public.replace(process.cwd() + path.sep, ''),
    describe: 'Path to static assets'
  },
  m: {
    alias: 'in-memory',
    type: 'boolean',
    default: false,
    describe: 'Whether to start the PouchDB Server in memory'
  },
  data: {
    type: 'string',
    default: defaults.paths.data.replace(process.cwd() + path.sep, ''),
    describe: 'Data path'
  },
  'db-url': {
    type: 'string',
    default: undefined,
    describe: 'If provided, uses external CouchDB. URL has to contain credentials.'
  },
  plugins: {
    type: 'boolean',
    default: {},
    describe: 'Define options, keyed by their name'
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

// merge args with rc config
// rc generates 'config' and 'configs', which we don't need
var options = _.omit(rc('hoodie', args, null), ['config', 'configs'])

log.level = options.loglevel || 'warn'

log.verbose('app', 'Initialising')

getHoodieServer(options, function (error, server, config) {
  if (error) {
    var stack = new Error().stack.split('\n').slice(2).join('\n')
    return log.error('app', 'Failed to initialise:\n' + stack, error)
  }

  log.verbose('app', 'Starting')

  server.start(function () {
    console.log((useEmoji ? emoji.get('dog') + '  ' : '') + 'Your Hoodie app has started on ' + url.format({
      protocol: 'http',
      hostname: config.connection.host,
      port: config.connection.port
    }))
    console.log('Stop server with control + c')
  })
})

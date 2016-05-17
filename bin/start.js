#!/usr/bin/env node

var url = require('url')

var _ = require('lodash')
var emoji = require('node-emoji')
var log = require('npmlog')
var yargs = require('yargs')
var rc = require('rc')
var semver = require('semver')

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
    default: 6004
  },
  'bind-address': {
    type: 'string',
    default: '0.0.0.0'
  },
  public: {
    type: 'string',
    default: undefined,
    normalize: true
  },
  m: {
    alias: 'in-memory',
    type: 'boolean',
    default: true
  },
  data: {
    type: 'string',
    default: undefined,
    normalize: true
  },
  'db-url': {
    type: 'string',
    default: undefined
  },
  plugins: {
    describe: 'Define plugins to be loaded and their options',
    type: 'array',
    default: []
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
    _.forEach(pkg.dependencies, function (value, key) {
      if (!/^hoodie/.test(key)) return

      console.log(key + ': ' + value)
    })
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
    console.log((useEmoji ? emoji.get('dog') + '  ' : '') + 'Your Hoodie app has started on ' + url.format(config.connection))
  })
})

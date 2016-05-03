#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var url = require('url')

var _ = require('lodash')
var emoji = require('node-emoji')
var log = require('npmlog')
var nopt = require('nopt')
var rc = require('rc')
var relative = require('require-relative')
var semver = require('semver')

var getHoodieServer = require('../lib')

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
  silly: 'Sill' + (useEmoji ? emoji.get('mega') + ' ' : ''),
  verbose: 'Verb' + (useEmoji ? emoji.get('speech_balloon') + ' ' : ''),
  info: 'Info' + (useEmoji ? emoji.get('mag') + ' ' : ''),
  http: 'HTTP' + (useEmoji ? emoji.get('link') + ' ' : ''),
  warn: 'Warn' + (useEmoji ? emoji.get('zap') + ' ' : ''),
  error: 'Err!' + (useEmoji ? emoji.get('anger') + ' ' : ''),
  silent: 'silent'
}
log.heading = (useEmoji ? emoji.get('dog') + ' ' : '') + 'Hoodie'

if (semver.lt(process.versions.node, '4.0.0')) {
  log.error('env', 'A node version >=4 is required to run Hoodie')
  process.exit(1)
}

var knownOpts = {
  help: Boolean,
  version: Boolean,
  loglevel: [
    'silly',
    'verbose',
    'info',
    'http',
    'warn',
    'error',
    'silent'
  ],
  port: Number,
  'bind-address': String,
  public: path,
  'in-memory': Boolean,
  data: path,
  'db-url': String
}

var shortHands = {
  h: '--help',
  usage: '--help',
  v: '--version',
  m: '--in-memory',
  s: ['--loglevel', 'silent'],
  d: ['--loglevel', 'info'],
  dd: ['--loglevel', 'verbose'],
  ddd: ['--loglevel', 'silly'],
  silent: ['--loglevel', 'silent'],
  verbose: ['--loglevel', 'verbose'],
  quiet: ['--loglevel', 'warn']
}

var argv = nopt(knownOpts, shortHands)

if (argv.help) {
  process.stdout.write(fs.readFileSync(path.join(__dirname, 'readme.txt'), 'utf8'))
  process.exit(0)
}

if (argv.version) {
  try {
    var pkg = relative('hoodie/package.json')
    console.log(pkg.version, '\n')
    _.forEach(pkg.dependencies, function (value, key) {
      if (!/^hoodie/.test(key)) return

      console.log(key + ': ' + value)
    })
    process.exit(0)
  } catch (e) {
    process.exit(1)
  }
}

var options = rc('hoodie', {}, _.mapKeys(_.omit(argv, ['argv']), function (value, key) {
  return _.camelCase(key)
}))

log.level = options.loglevel || 'warn'

log.verbose('app', 'Initializing')

getHoodieServer(options, function (err, server, envConfig) {
  if (err) return log.error('app', 'Failed to initialize', err)

  log.verbose('app', 'Starting')

  server.start(function () {
    console.log((useEmoji ? emoji.get('dog') + ' ' : '') + 'Your Hoodie app has started on ' + url.format(envConfig.app))
    log.verbose('app', 'Database running at ' + url.format(_.omit(envConfig.db, 'auth')))
  })
})

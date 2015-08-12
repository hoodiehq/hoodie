/**
 * This module returns appropriate config values for the provided
 * platform, environment and project.
 */

var path = require('path')
var url = require('url')

var _ = require('lodash')
var ports = require('ports')

var couchUtils = require('../utils/couch')

/**
 * Returns all config values for current environment
 */

module.exports = function (options) {
  var platform = options.platform || process.platform
  var env = options.env || process.env
  var cwd = options.cwd || process.cwd()
  var argv = options.argv || {}

  // location of project's package.json
  var pkgfile = require(cwd + '/package.json')

  // default platform-agnostic config
  var env_config = {
    default_file: path.join(cwd, 'www', 'index.html'),
    project_dir: cwd,
    www_root: path.join(cwd, (argv.www || argv.w || 'www')),
    admin_root: path.dirname(require.resolve('hoodie-admin-dashboard/www/index.html')),
    host: env.HOODIE_BIND_ADDRESS || '127.0.0.1',
    app: pkgfile,
    domain: 'dev',
    verbose: argv.verbose || argv.v,
    debug: argv.debug || argv.d,
    platform: platform,
    boring: false, // turn off fancy terminal stuff where possible
    id: pkgfile.name,
    // add Hoodie paths to config
    hoodie: {
      env: env,
      app_path: cwd,
      data_path: path.join(cwd, 'data')
    },
    couch: couchUtils.getCouch(env),
    open_browser: (env.CI || '').toLowerCase() !== 'true'
  }

  // option to configure custom ports
  if (argv.hasOwnProperty('custom-ports')) {
    var c_ports = _(argv['custom-ports'].split(','))

      .map(function (port) {
        return parseInt(port.trim(), 10)
      })
      .compact()
      .filter(function (port) {
        return port > 0
      })
      .uniq()
      .value()

    if (c_ports.length !== 3) {
      throw new Error('custom-ports option must contain 3 ports separated by ' +
        'commas, ie: --custom-ports 7777,8888,9999')
    }

    env_config.www_port = c_ports[0]
    env_config.admin_port = c_ports[1]
    env_config.couch.port = c_ports[2]
  } else {
    env_config.www_port = ports.getPort(env_config.id + '-www')
    env_config.admin_port = ports.getPort(env_config.id + '-admin')
  }

  env_config.www_link = 'http://' + env_config.host + ':' + env_config.www_port
  env_config.admin_link = 'http://' + env_config.host + ':' + env_config.admin_port

  if (!env.COUCH_URL && !argv.hasOwnProperty('custom-ports')) {
    env_config.couch.port = ports.getPort(env_config.id + '-couch')
  }

  if (env.HOODIE_SETUP_PASSWORD) {
    env_config.admin_password = env.HOODIE_SETUP_PASSWORD
  }

  if (!env_config.couch.url) {
    env_config.couch.url = 'http://' + env_config.host + ':' + env_config.couch.port
  }
  // get the host for couchb url
  var parsed = url.parse(env_config.couch.url)

  env_config.couch.host = parsed.hostname
  env_config.couch.port = parsed.port || 80

  return env_config
}

/**
 * This module returns appropriate config values for the provided
 * platform, environment and project. It is used directly by the start
 * script in the bin directory.
 */

var url = require('url');
var path = require('path');

var _ = require('lodash');
var ports = require('ports');

var utils = require('../utils');
var couchUtils = require('../utils/couch');

/**
 * Returns all config values for current environment
 */

exports.getConfig = function (platform, env, cwd, argv) {
  cwd = path.resolve(cwd);

  // location of project's package.json
  var pkgfile = require(cwd + '/package.json');

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
    local_tld: argv['local-tld'],
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
    open_browser: env.CI ? false : true
  };

  // option to configure custom ports
  if (argv.hasOwnProperty('custom-ports')) {
    var c_ports = _(argv['custom-ports'].split(','))
    .map(function (port) {
      return parseInt(port.trim(), 10);
    })
    .compact()
    .filter(function (port) {
      return port > 0;
    })
    .uniq()
    .value();

    if (c_ports.length !== 3) {
      throw new Error('custom-ports option must contain 3 ports separated by ' +
                      'commas, ie: --custom-ports 7777,8888,9999');
    }

    env_config.www_port = c_ports[0];
    env_config.admin_port = c_ports[1];
    env_config.couch.port = c_ports[2];
  } else {
    env_config.www_port = ports.getPort(env_config.id + '-www');
    env_config.admin_port = ports.getPort(env_config.id + '-admin');
  }

  env_config.www_link = function () {
    return env_config.local_tld ? env_config.www_local_url
      : 'http://' + env_config.host + ':' + env_config.www_port;
  };
  env_config.admin_link = function () {
    return env_config.local_tld ? env_config.admin_local_url
      : 'http://' + env_config.host + ':' + env_config.admin_port;
  };

  // do magic firewall stuff for .dev domains on mac
  if (platform === 'darwin') {
    // only if it is installed
    try {
      require('local-tld');
      env_config.local_tld = true;
    } catch (e) {
        // no local-tld, it’s fine, carry on.
    }
  }

  if (utils.isNodejitsu(env)) {

    // bail if we run with insufficent params
    //
    if (!env.COUCH_URL) {
      throw new Error('COUCH_URL environment variable not set');
    }

    if (!env.HOODIE_ADMIN_USER) {
      throw new Error('HOODIE_ADMIN_USER environment variable not set');
    }

    if (!env.HOODIE_ADMIN_PASS) {
      throw new Error('HOODIE_ADMIN_PASS environment variable not set');
    }

    _.defaults(env_config, {
      // Nodejitsu config
      host: '0.0.0.0',
      domain: 'jit.su',
      couch: {
        run: false
      },

      // move the www and admin ports and run a nodejitsu server
      // to proxy requests to them based on subdomains (since we don't
      // run local-tld on nodejitsu)
      www_port: 8180,
      admin_port: 8190,
      run_nodejitsu_server: true
    });
  }

  if (!env.COUCH_URL && !argv.hasOwnProperty('custom-ports')) {
    env_config.couch.port = ports.getPort(env_config.id + '-couch');
  }

  if (env.HOODIE_SETUP_PASSWORD) {
    env_config.admin_password = env.HOODIE_SETUP_PASSWORD;
  }

  if (!env_config.couch.url) {
    env_config.couch.url = 'http://' + env_config.host + ':' + env_config.couch.port;
  }
  // get the host for couchb url
  var parsed = url.parse(env_config.couch.url);

  env_config.couch.host = parsed.hostname;
  env_config.couch.port = parsed.port || 80;

  return env_config;
};

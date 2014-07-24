/**
 * This module returns appropriate config values for the provided
 * platform, environment and project. It is used directly by the start
 * script in the bin directory.
 */

var url = require('url');
var path = require('path');
var ports = require('ports');
var _ = require('lodash/dist/lodash.underscore');
var path = require('path');

var utils = require('../utils');
var couchUtils = require('../utils/couch');


/**
 * Returns all config values for current environment
 */

exports.getConfig = function (platform, env, cwd, argv) {

  // Remove driver letter on windows
  cwd = '/' + path.relative('/', cwd);

  // location of project's package.json
  var pkgfile = require(cwd + '/package.json');
  var hoodie_admin_dashboard_root ='/node_modules/hoodie-server/node_modules/hoodie-admin-dashboard/www';

  // default platform-agnostic config
  var env_config = {
    default_file: path.resolve(cwd, '' + path.join(cwd, 'www') + '/index.html'),
    project_dir: cwd,
    www_root: path.resolve(path.join(cwd, 'www')),
    admin_root: path.resolve(cwd + hoodie_admin_dashboard_root),
    host: env.HOODIE_BIND_ADDRESS || '127.0.0.1',
    app: pkgfile,
    domain: 'dev',
    verbose: false,
    local_tld: undefined,
    platform: platform,
    boring: false, // turn off fancy terminal stuff where possible
    id: pkgfile.name,
    // add Hoodie paths to config
    hoodie: {
      env: env,
      app_path: path.resolve(cwd),
      data_path: path.resolve(path.join(cwd, 'data'))
    },
    couch: couchUtils.getCouch(env),
    open_browser: env.CI ? false : true
  };

  // option to set server root url
  if (argv.hasOwnProperty('www') || argv.hasOwnProperty('w')) {
    env_config.www_root = path.resolve(cwd + '/' + (argv.www || argv.w));
  }

  if (argv.hasOwnProperty('verbose') || argv.hasOwnProperty('v')) {
    env_config.verbose = true;
  }

  // option to configure custom ports
  if (argv.hasOwnProperty('custom-ports')) {
    var c_ports = argv['custom-ports'].split(',').reduce(function (memo, port) {
      port = parseInt(port, 10);
      if (port > 0) {
        memo.push(port);
      }
      return memo;
    }, []);
    if (c_ports.length === 3) {
      env_config.www_port = c_ports[0];
      env_config.admin_port = c_ports[1];
      env_config.couch.port = c_ports[2];
    } else {
      throw new Error('custom-ports option must contain 3 ports separated by ' +
                      'commas, ie: --custom-ports 7777,8888,9999');
    }
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

  // option to turn on/off local-tld on command-line
  if (argv.hasOwnProperty('local-tld')) {
    env_config.local_tld = argv['local-tld'];
  }

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


/**
 * This module returns appropriate config values for the provided
 * platform, environment and project. It is used directly by the start
 * script in the bin directory.
 */

var fs = require('fs');
var url = require('url');
var path = require('path');
var ports = require('ports');
var _ = require('underscore');
var path = require('path');

var utils = require('../utils');


/**
 * Returns all config values for current environment
 */

exports.getConfig = function (platform, env, project_dir, argv) {
  
  // Remove driver letter on windows
  project_dir = '/' + path.relative('/', project_dir);
  
  // location of project's package.json
  var pkgfile = require(project_dir + '/package.json');

  // default platform-agnostic config
  var cfg = {
    default_file: function () {
      // the default file to serve when url does not match static file
      return path.resolve(project_dir, '' + this.www_root + '/index.html');
    },
    project_dir: project_dir,
    www_root: project_dir + '/www',
    admin_root: project_dir + '/node_modules/hoodie-server/node_modules/hoodie-pocket/www',
    host: process.env.HOODIE_BIND_ADDRESS || '127.0.0.1',
    app: pkgfile,
    domain: 'dev',
    local_tld: undefined,
    platform: platform,
    boring: false, // turn off fancy terminal stuff where possible
    // set the Hoodie instance ID, this is used to check
    // against the user roles when doing a test for Hoodie admin
    id: pkgfile.name,
    // add Hoodie paths to config
    hoodie: {
      app_path: path.resolve(project_dir, 'data')
    },
    couch: exports.getCouch(env),
    open_browser: process.env.CI ? false : true
  };

  cfg.www_port = ports.getPort(cfg.id + '-www');
  cfg.www_link = function () {
    return cfg.local_tld
      ? cfg.www_local_url
      : 'http://' + cfg.host + ':' + cfg.www_port;
  };
  cfg.admin_port = ports.getPort(cfg.id + '-admin');
  cfg.admin_link = function () {
    return cfg.local_tld
      ? cfg.admin_local_url
      : 'http://' + cfg.host + ':' + cfg.admin_port;
  };

  // option to turn on/off local-tld on command-line
  if (argv.hasOwnProperty('local-tld')) {
    cfg.local_tld = argv['local-tld'];
  }

  // option to set server root url
  if (argv.hasOwnProperty('www')) {
    cfg.www_root = argv.www;
  }

  // do magic firewall stuff for .dev domains on mac
  if (platform === 'darwin') {
    // only if it is installed
    try {
      require('local-tld');
      cfg.local_tld = true;
    } catch (e) {
        // no local-tld, it’s fine, carry on.
    }
  }

  if (utils.isNodejitsu(env)) {

    // bail of we run with insufficent params
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

    _.defaults(cfg, {
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


  if (!process.env.COUCH_URL) {
    cfg.couch.port = ports.getPort(cfg.id + '-couch');
  }

  if (process.env.HOODIE_SETUP_PASSWORD) {
    cfg.admin_password = process.env.HOODIE_SETUP_PASSWORD;
  }


  if (!cfg.couch.url) {
    cfg.couch.url = 'http://' + cfg.host + ':' + cfg.couch.port;
  }
  // get the host for couchb url
  var parsed = url.parse(cfg.couch.url);

  cfg.couch.host = parsed.hostname;
  cfg.couch.port = parsed.port || 80;

  return cfg;
};

/**
 * Find CouchDB locations
 */

exports.getCouch = function (env) {

  var couch = {
    run: true // start local couch
  };

  if (env.COUCH_URL) {
    couch.url = env.COUCH_URL; // using remote couchdb
    couch.run = false;
    return couch;
  }

  // check filesystem for likely couch paths
  if (fs.existsSync('/usr/local/bin/couchdb')) {
    couch.bin = '/usr/local/bin/couchdb';
    couch.default_ini = '/usr/local/etc/couchdb/default.ini';
  } else if (fs.existsSync('/opt/local/bin/couchdb')) {
    couch.bin = '/opt/local/bin/couchdb';
    couch.default_ini = '/opt/local/etc/couchdb/default.ini';
  } else if (fs.existsSync('/usr/bin/couchdb')) {
    couch.bin = '/usr/bin/couchdb';
    couch.default_ini = '/etc/couchdb/default.ini';
  }
  // override if environment vars set
  if (env.COUCH_BIN) {
    couch.bin = env.COUCH_BIN;
  }

  if (env.COUCH_DEFAULT_INI) {
    couch.default_ini = env.COUCH_DEFAULT_INI;
  }

  return couch;
};

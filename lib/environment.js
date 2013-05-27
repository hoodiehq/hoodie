/**
 * This module returns appropriate config values for the provided
 * platform, environment and project. It is used directly by the start
 * script in the bin directory.
 */

var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    _ = require('underscore');


/**
 * Returns all config values for current environment
 */

exports.getConfig = function (platform, env, project_dir, argv) {
    // location of project's package.json
    var pkgfile = path.resolve(project_dir, 'package.json');

    // default platform-agnostic config
    var cfg = {
        project_dir: project_dir,
        host: '127.0.0.1',
        www_port: 8080,
        admin_port: 8090,
        app: JSON.parse(fs.readFileSync(pkgfile)),
        domain: 'dev',
        local_tld: false
    };

    // set the Hoodie instance ID, this is used to check
    // against the user roles when doing a test for Hoodie admin
    cfg.id = cfg.app.name;

    // add CouchDB paths to config
    cfg = _.extend(cfg, exports.getCouch(env));
    // add Hoodie paths to config
    cfg = _.extend(cfg, exports.getHoodie(platform));

    // set path to Hoodie app's data directory
    cfg.hoodie.app_path = path.resolve(
        cfg.hoodie.apps_path,
        cfg.app.name
    );

    // do magic firewall stuff for .dev domains on mac
    if (platform === 'darwin') {
        cfg.local_tld = true;
    }

    // option to turn on/off local-tld on command-line
    if (argv.hasOwnProperty('local-tld')) {
        cfg.local_tld = argv['local-tld'];
    }

    if (exports.isNodejitsu(env)) {
        // Nodejitsu config
        cfg.host = '0.0.0.0';
        cfg.domain = 'jit.su';
        cfg.couch.run = false;

        // move the www and admin ports and run a nodejitsu server
        // to proxy requests to them based on subdomains (since we don't
        // run local-tld on nodejitsu)
        cfg.www_port = 8180;
        cfg.admin_port = 8190;
        cfg.run_nodejitsu_server = true;

        // turn off fancy terminal stuff where possible
        cfg.boring = true;

        if (!env.COUCH_URL) {
            throw new Error('COUCH_URL environment variable not set');
        }
        if (!env.HOODIE_ADMIN_USER) {
            throw new Error('HOODIE_ADMIN_USER environment variable not set');
        }
        if (!env.HOODIE_ADMIN_PASS) {
            throw new Error('HOODIE_ADMIN_PASS environment variable not set');
        }
    }
    if (!cfg.couch.url) {
        cfg.couch.url = 'http://' + cfg.host + ':8100';
    }

    // get the host for couchb url
    var parsed = url.parse(cfg.couch.url);
    cfg.couch.host = parsed.hostname;
    cfg.couch.port = parsed.port;

    return cfg;
};

/**
 * Attempts to detect a Nodejitsu environment
 */

exports.isNodejitsu = function (env) {
    return !!(env.SUBDOMAIN);
};

/**
 * Find CouchDB locations
 */

exports.getCouch = function (env) {
    var cfg = {couch: {}};

    if (env.COUCH_URL) {
        // using remote couchdb
        cfg.couch.url = env.COUCH_URL;
        cfg.couch.run = false;
        return cfg;
    }

    // start local couch
    cfg.couch.run = true;

    // check filesystem for likely couch paths
    if (fs.existsSync('/usr/local/bin/couchdb')) {
        cfg.couch.bin = '/usr/local/bin/couchdb';
        cfg.couch.default_ini = '/usr/local/etc/couchdb/default.ini';
    }
    else if (fs.existsSync('/opt/local/bin/couchdb')) {
        cfg.couch.bin = '/opt/local/bin/couchdb';
        cfg.couch.default_ini = '/opt/local/etc/couchdb/default.ini';
    }
    else if (fs.existsSync('/usr/bin/couchdb')) {
        cfg.couch.bin = '/usr/bin/couchdb';
        cfg.couch.default_ini = '/etc/couchdb/default.ini';
    }
    // override if environment vars set
    if (env.COUCH_BIN) {
        cfg.couch.bin = env.COUCH_BIN;
    }
    if (env.COUCH_DEFAULT_INI) {
        cfg.couch.default_ini = env.COUCH_DEFAULT_INI;
    }
    return cfg;
};

/**
 * Find Hoodie locations
 */

exports.getHoodie = function (platform, env) {
    var home = process.env.HOME,
        cfg = {hoodie: {}};

    if (platform === 'darwin') {
        cfg.hoodie.path = path.resolve(home, "Library/Hoodie");
        cfg.hoodie.apps_path = path.resolve(cfg.hoodie.path, 'Apps');
    }
    else {
        cfg.hoodie.path = path.resolve(home, '.hoodie');
        cfg.hoodie.apps_path = path.resolve(cfg.hoodie.path, 'apps');
    }
    return cfg;
};

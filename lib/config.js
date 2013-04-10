/**
 * This module returns appropriate config values for the provided
 * platform, environment and project. It is used directly by the start
 * script in the bin directory.
 */

var fs = require('fs'),
    path = require('path'),
    _ = require('underscore');


/**
 * Returns all config values for current environment
 */

exports.getConfig = function (platform, env, project_dir) {
    // location of project's package.json
    var pkgfile = path.resolve(project_dir, 'package.json');

    // default platform-agnostic config
    var config = {
        project_dir: project_dir,
        //host: '0.0.0.0',
        app: JSON.parse(fs.readFileSync(pkgfile)),
        domain: 'dev',
        local_tld: false,
        www_server: {
            host: '127.0.0.1',
            port: 8080
        }
    };

    // add CouchDB paths to config
    config = _.extend(config, exports.getCouch(env));
    // add Hoodie paths to config
    config = _.extend(config, exports.getHoodie(platform));

    // start local couch by default
    config.couch.run = true;

    // do magic firewall stuff for .dev domains on mac
    if (platform === 'darwin') {
        config.local_tld = true;
    }

    // Nodejitsu config
    if (exports.isNodejitsu(env)) {
        config.couch.run = false;
        config.domain = 'jit.su';
    }

    return config;
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
    // check filesystem for likely couch paths
    if (fs.existsSync('/usr/local/bin/couchdb')) {
        cfg.couch.bin = '/usr/local/bin/couchdb';
        cfg.couch.default_ini = '/usr/local/etc/couchdb/default.ini';
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
        cfg.couch.defualt_ini = env.COUCH_DEFAULT_INI;
    }
    return cfg;
};

/**
 * Find Hoodie locations
 */

exports.getHoodie = function (platform, env) {
    var home = process.env.HOME,
        cfg = {hoodie: {}};

    if (process.platform === 'darwin') {
        cfg.hoodie.path = path.resolve(home, "Library/Hoodie");
        cfg.hoodie.apps_path = path.resolve(cfg.hoodie.path, 'Apps');
        return cfg;
    }
    else if (process.platform === 'linux') {
        cfg.hoodie.path = path.resolve(home, '.hoodie');
        cfg.hoodie.apps_path = path.resolve(cfg.hoodie.path, 'apps');
        return cfg;
    }
    else {
        throw new Error('Unsuported platform: ' + process.platform);
    }
};

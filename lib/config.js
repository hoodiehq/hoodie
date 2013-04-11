/**
 * This module returns appropriate config values for the provided
 * platform, environment and project. It is used directly by the start
 * script in the bin directory.
 */

var fs = require('fs'),
    url = require('url'),
    npm = require('npm');
    path = require('path'),
    _ = require('underscore');


/**
 * Returns all config values for current environment
 */

exports.getConfig = function (platform, env, project_dir) {
    // location of project's package.json
    var pkgfile = path.resolve(project_dir, 'package.json');

    // default platform-agnostic config
    var cfg = {
        project_dir: project_dir,
        host: '127.0.0.1',
        port: 8080,
        app: JSON.parse(fs.readFileSync(pkgfile)),
        domain: 'dev',
        local_tld: false
    };

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

    if (exports.isNodejitsu(env)) {
        // Nodejitsu config
        cfg.host = '0.0.0.0';
        cfg.domain = 'jit.su';
        cfg.couch.run = false;
        cfg.couch.url = env.COUCH_URL;
    }
    else {
        // start local couch
        cfg.couch.run = true;
        cfg.couch.port = 8081;
        cfg.couch.url = 'http://' + cfg.host + ':' + cfg.couch.port;
    }

    // get the host for couchb url
    if (cfg.couch.url) {
        cfg.couch.host = url.parse(cfg.couch.url).hostname;
    }

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

/**
 * Gets the CouchDB admin password stored in NPM for a given app name
 */

exports.getAdminPassword = function (app_name, callback) {
    npm.load(function (err, npm) {
        if (err) {
            return callback(err);
        }
        var password = (
            npm.config.get(app_name + '_admin_pass') ||
            process.env['HOODIE_ADMIN_PASS']
        );
        // toString, otherwise only digit passwords fail
        return callback(null, password.toString());
    });
};

/**
 * Tools for managing Hoodie workers
 */

var path = require('path'),
    couchr = require('couchr'),
    config = require('./config'),
    client = require('./client'),
    utils = require('./utils'),
    fs = require('fs'),
    _ = require('underscore');


/**
 * Starts all workers defined in the project's package.json file
 */

exports.startAll = function (cfg, callback) {
    // get couchdb admin password from config.json
    config.getCouchCredentials(cfg, function (err, username, password) {
        if (err) {
            return callback(err);
        }

        // create a client interface to hoodie server and couchdb
        client.createClient(cfg, username, password, function (err, hoodie) {
            if (err) {
                return callback(err);
            }

            // worker config
            var wconfig = {
                server: cfg.couch.url,
                persistent_since_storage: false,
                admin: {
                    user: username,
                    pass: password
                }
            };

            // loop through workers and start
            var names = exports.getWorkerNames(cfg.app);
            var workers = names.map(function (name) {
                wconfig.name = name;
                return exports.startWorker(cfg.project_dir, wconfig, hoodie);
            });

            console.log("All workers started.");
            callback();
        });
    });
};

/**
 * Starts the named Hoodie worker
 */

exports.startWorker = function (project_dir, wconfig, hoodie) {
    console.log("Starting: '%s'", wconfig.name);
    var id = 'hoodie-worker-' + wconfig.name;
    var p = path.resolve(project_dir, 'node_modules/' + id);
    var wmodule = require(p);
    return wmodule(utils.jsonClone(wconfig), hoodie);
};

/**
 * Finds all the dependencies in the app's package.json which
 * start with 'worker-'
 */

exports.getWorkerModuleNames = function (pkg) {
    return _.filter(_.keys(pkg.dependencies), function (d) {
        return /^hoodie-worker-/.test(d);
    });
};

/**
 * Converts an NPM package name to a Hoodie worker name
 */

exports.workerModuleToName = function (mod) {
    return mod.replace(/^hoodie-worker-/, '');
};

/**
 * Finds all the dependencies in the app's package.json which
 * start with 'worker-' and returns them with the hoodie-worker part
 * of the name removed
 */

exports.getWorkerNames = function (pkg) {
    var names = exports.getWorkerModuleNames(pkg);
    return _.map(names, exports.workerModuleToName);
};

/**
 * Returns the fs path to the worker
 */

exports.workerPath = function (cfg, mod) {
    console.log(['workerPath', cfg, mod]);
    return path.resolve(cfg.project_dir, 'node_modules', mod);
};

/**
 * Reads the worker's package.json file returning plugin metadata from it
 */

exports.readMetadata = function (cfg, mod) {
    console.log(['readMetadata', cfg, mod]);
    var p = path.resolve(exports.workerPath(cfg, mod), 'package.json');
    var pkg = JSON.parse(fs.readFileSync(p).toString());
    var name = exports.workerModuleToName(pkg.name);
    return {
        name: name,
        title: pkg.title || name,
        version: pkg.version
    };
};

/**
 * Gets config values from the database for a given worker name
 */

exports.getWorkerConfig = function (cfg, name, callback) {
    config.getCouchCredentials(cfg, function (err, username, password) {
        // add auth details to couch url
        var base_url = url.parse(cfg.couch.url);
        base_url.auth = user + ':' + password;

        var doc_url = url.resolve(
            base_url, 'plugins/' + encodeURIComponent('plugin/' + name)
        );
        couchr.get(doc_url, function (err, data, res) {
            if (err) {
                return callback(err);
            }
        });
    });
}

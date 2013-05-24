/**
 * Tools for managing Hoodie workers
 */

var path = require('path'),
    config = require('./config'),
    client = require('./client'),
    utils = require('./utils'),
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

exports.getWorkerNames = function (pkg) {
    var names = _.filter( Object.keys(pkg.dependencies), function (d) {
        return /^hoodie-worker-/.test(d);
    });
    names = _.map(names, function(name) {
        return name.replace(/^hoodie-worker-/, '');
    });
    return names;
};

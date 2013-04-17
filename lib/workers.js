/**
 * Tools for managing Hoodie workers
 */

var config = require('./config'),
    client = require('./client'),
    utils = require('./utils'),
    _ = require('underscore');


/**
 * Starts all workers defined in the project's package.json file
 */

exports.startAll = function (cfg, callback) {
    // get couchdb admin password from npm
    config.getAdminPassword(cfg.app.name, function (err, password) {

        // create a client interface to hoodie server and couchdb
        var hoodie = client.createClient(cfg, password);

        // worker config
        var wconfig = {
            server: cfg.couch.url,
            persistent_since_storage: false,
            admin: {
                user: "admin",
                pass: password
            }
        };

        // loop through workers and start
        var names = exports.getWorkerNames(cfg.app);
        var workers = names.map(function (name) {
            wconfig.name = name;
            return exports.startWorker(wconfig, hoodie);
        });

        console.log("All workers started.");
        callback();
    });
};

/**
 * Starts the named Hoodie worker
 */

exports.startWorker = function (wconfig, hoodie) {
    console.log("Starting: '%s'", wconfig.name);
    var wmodule = require('hoodie-' + wconfig.name);
    return wmodule(utils.jsonClone(wconfig), hoodie);
};

/**
 * Finds all the dependencies in the app's package.json which
 * start with 'worker-'
 */

exports.getWorkerNames = function (pkg) {
    return _.filter(Object.keys(pkg.dependencies), function (d) {
        return d.substr(0, 7) == "worker-";
    });
};

/**
 * Tools for managing Hoodie workers
 */

var config = require('./config'),
    _ = require('underscore');


/**
 * Starts all workers defined in the project's package.json file
 */

exports.startAll = function (cfg, callback) {
    // get couchdb admin password from npm
    config.getAdminPassword(cfg.app.name, function (err, password) {
        var wconfig = {
            server: cfg.couch.url,
            persistent_since_storage: false,
            admin: {
                user: "admin",
                pass: password
            }
        };
        var names = exports.getWorkerNames(cfg.app);
        var workers = names.map(function (w) {
            return exports.startWorker(wconfig, w);
        });
        console.log("All workers started.");
        callback();
    });
};

/**
 * Starts the named Hoodie worker
 */

exports.startWorker = function (wconfig, name) {
    console.log("Starting: '%s'", name);

    var worker = require("hoodie-" + name);
    wconfig.name = name.replace(/^worker-/, '');

    // temp debug
    console.log("Initializing %s worker with: ", name)
    console.log(JSON.parse(JSON.stringify(wconfig)));

    return new worker(JSON.parse(JSON.stringify(wconfig)));
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

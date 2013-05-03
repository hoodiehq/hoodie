/**
 * Starts a local CouchDB instance using the Hoodie app's data
 * directory for storage.
 */

var MultiCouch = require('multicouch'),
    request = require('request'),
    async = require('async'),
    path = require('path');


/**
 * Starts the CouchDB server using multicouch
 */

exports.startMultiCouch = function (config, callback) {

    // skip local couch server on some platforms (eg, nodejitsu)
    if (!config.couch.run) {
        console.log('Using remote CouchDB: ' + config.couch.url);
        return process.nextTick(callback);
    }

    // MultiCouch config object
    var couch_cfg = {
        port: config.couch.port,
        prefix: config.hoodie.app_path,
        couchdb_path: config.couch.bin,
        default_sys_ini: config.couch.default_ini,
        respawn: false // otherwise causes problems shutting down on ctrl-c
    };

    // validate couchdb config
    if (!couch_cfg.couchdb_path) {
        return callback(new Error('No CouchDB binary found'));
    }
    if (!couch_cfg.default_sys_ini) {
        return callback(new Error('No CouchDB default.ini found'));
    }

    // starts a local couchdb server using the Hoodie app's data dir
    var couchdb = new MultiCouch(couch_cfg);

    // used to pass startup errors to callback
    var started = false;

    // local couchdb has started
    couchdb.on('start', function () {
        if (config.local_tld) {
            console.log('CouchDB started: ' + config.couch.local_url);
        }
        else {
            console.log(
                'CouchDB started: ' +
                'http://' + config.host + ':' + config.couch.port
            );
        }
        started = true;
        return callback();
    });

    // report errors from couchdb
    couchdb.on('error', function (err) {
        if (!started) {
            // pass startup error to callback
            return callback(err);
        }
        else {
            // log couchdb errors after server is started
            console.log('CouchDB Error: %j', err);
        }
    });

    // shutdown the couch server if the hoodie-app server is stopped
    process.on('exit', function () {
        exports.stop(couchdb, function () {
            process.exit(0);
        });
    });

    // on ctrl-c, stop couchdb first, then exit.
    process.on('SIGINT', function () {
        exports.stop(couchdb, function () {
            process.exit(0);
        });
    });

    couchdb.start();
    return couchdb;
};

/**
 * Polls CouchDB during startup so we know when we can make
 * requests against it
 */

exports.pollCouch = function (config, callback) {
    // when to stop polling and give up!
    var end = new Date().getTime() + 30000, // 30 second timeout
        logfile = path.resolve(config.hoodie.app_path, 'couch.log'),
        interval = 200; // poll every 200ms

    process.stdout.write('Waiting for CouchDB..');

    function _poll() {
        request(config.couch.url, function (err, res) {
            if (res && res.statusCode === 200) {
                process.stdout.write(' done!\n');
                return callback();
            }
            else {
                // CouchDB not available yet
                if (new Date().getTime() >= end) {

                    // Exceeded timeout value
                    process.stdout.write('\n');
                    return callback(new Error(
                        'Timed out waiting for CouchDB, please check ' +
                        logfile
                    ));
                }
                // wait and try again
                process.stdout.write('.');
                return setTimeout(_poll, interval);
            }
        });
    }

    // start polling
    _poll();
};

/*
 * Starts the CouchDB server and waits for it to be responsive
 * before calling the callback
 */

exports.start = async.applyEachSeries([
    exports.startMultiCouch,
    exports.pollCouch
]);

/**
 * Stops the provided CouchDB server
 */

exports.stop = function (couchdb, callback) {
    console.log('Stopping CouchDB...');
    couchdb.once('stop', callback);
    couchdb.stop();
};

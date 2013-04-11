/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var path = require('path'),
    async = require('async'),
    utils = require('./utils'),
    couch = require('./couch'),
    server = require('./server'),
    installer = require('./installer'),
    workers = require('./workers'),
    prompt = require('prompt');


/**
 * Initializes and starts a new Hoodie app server
 */

exports.init = function (config, callback) {
    prompt.start();
    prompt.message = '';
    prompt.delimiter = '';
    prompt.colors = false;

    console.log('Initializing...');
    async.applyEachSeries([
        exports.ensurePaths,
        couch.start,
        installer.install,
        server.start,
        workers.startAll
    ],
    config, callback);
};

/**
 * Makes sure the appropriate app directories exists
 */

exports.ensurePaths = function (config, callback) {
    var paths = [
        config.hoodie.path,
        config.hoodie.apps_path,
        config.hoodie.app_path
    ];
    async.map(paths, utils.ensureDir, callback);
};

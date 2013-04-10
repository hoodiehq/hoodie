/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var path = require('path'),
    async = require('async'),
    utils = require('./utils'),
    www = require('./servers/www'),
    couch = require('./servers/couch');


/**
 * Initializes and starts a new Hoodie app server
 */

exports.init = function (config, callback) {
    console.log('Initializing...');
    async.applyEachSeries([
        exports.ensurePaths,
        www.start,
        couch.start
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

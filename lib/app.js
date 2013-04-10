/**
 * Initializes directories, installs dependencies then starts all
 * configured servers for the Hoodie application
 */

var path = require('path'),
    async = require('async'),
    utils = require('./utils'),
    www = require('./servers/www');


/**
 * Initializes and starts a new Hoodie app server
 */

exports.init = function (config, callback) {
    console.log('Initializing...');
    async.applyEachSeries([
        exports.ensurePaths,
        www.start
    ],
    config, callback);
};

/**
 * Makes sure the appropriate app directories exists
 */

exports.ensurePaths = function (config, callback) {
    var paths = [
        config.hoodie_path,
        config.apps_path,
        path.join(config.apps_path, config.app.name)
    ];
    async.map(paths, utils.ensureDir, callback);
};

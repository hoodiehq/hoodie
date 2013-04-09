/**
 * Serves the app's static assets from the www directory
 */

var connect = require('connect'),
    loggers = require('./loggers'),
    http = require('http'),
    path = require('path');


/**
 * Starts a new HTTP server
 */

exports.start = function (config, callback) {
    // project's favicon location
    var static_dir = path.resolve(config.project_dir, 'www');

    // Defines a new ConnectJS app
    var app = connect(
        connect.logger(loggers.dev('www')),
        connect.compress(),
        connect.static(static_dir)
    );
    return http.createServer(app).listen(
        config.www_server.port,
        config.www_server.host,
        callback
    );
};

/**
 * Stops the provided HTTP server
 */

exports.stop = function (server, callback) {
    server.close(callback);
};

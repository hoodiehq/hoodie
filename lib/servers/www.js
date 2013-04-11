/**
 * Serves the app's static assets from the www directory
 */

var connect = require('connect'),
    loggers = require('./loggers'),
    utils = require('../utils'),
    http = require('http'),
    path = require('path');


/**
 * Starts a new HTTP server
 */

exports.start = function (config, callback) {
    // project's www directory location
    var static_dir = path.resolve(config.project_dir, 'www');

    // Defines a new ConnectJS app
    var app = connect(
        connect.logger(loggers.dev('www')),
        connect.compress(),
        connect.static(static_dir)
    );

    var host = config.host,
        port = config.www_server.port;

    return http.createServer(app).listen(port, host, utils.announce(
        'WWW started:   http://' + host + ':' + port,
        callback
    ));
};

/**
 * Stops the provided HTTP server
 */

exports.stop = function (server, callback) {
    server.close(callback);
};

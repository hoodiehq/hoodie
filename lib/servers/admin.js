/**
 * Serves the app's admin interface
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
    // project's favicon location
    var static_dir = path.resolve(__dirname,
        '../../node_modules/hoodie-pocket/www'
    );

    // Defines a new ConnectJS app
    var app = connect(
        connect.logger(loggers.dev('admin')),
        connect.compress(),
        connect.static(static_dir)
    );

    var host = config.host,
        port = config.admin_server.port;

    return http.createServer(app).listen(port, host, utils.announce(
        'Admin started: http://' + host + ':' + port,
        callback
    ));
};

/**
 * Stops the provided HTTP server
 */

exports.stop = function (server, callback) {
    server.close(callback);
};

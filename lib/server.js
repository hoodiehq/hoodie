/**
 * The Hoodie server, hosts www assets from project, hoodie admin interface,
 * and proxies api requests to CouchDB
 */

var connect = require('connect'),
    bytes = require('bytes'),
    http = require('http'),
    path = require('path'),
    utils = require('./utils'),
    api = require('./handlers/api'),
    admin = require('./handlers/admin'),
    www = require('./handlers/www');


/**
 * Starts a new HTTP server
 */

exports.start = function (config, callback) {
    // Defines a new ConnectJS app
    var app = connect(
        connect.logger(exports.devLogger),
        api(config),
        admin(config),
        www(config)
    );

    // Create HTTP server using the app and start listening
    var server = http.createServer(app);
    return server.listen(config.port, config.host, utils.announce(
        'Hoodie started on http://' + config.host + ':' + config.port,
        callback
    ));
};

/**
 * Stops the provided HTTP server
 */

exports.stop = function (server, callback) {
    server.close(callback);
};

/**
 * Development logger with color output and response times
 */

exports.devLogger = function (tokens, req, res) {
    var status = res.statusCode,
        len = parseInt(res.getHeader('Content-Length'), 10),
        color = 32;

    if (status >= 500) color = 31
    else if (status >= 400) color = 33
    else if (status >= 300) color = 36;

    len = isNaN(len) ? '' : len = ' - ' + bytes(len);

    return '\033[90m' + req.method
        + ' ' + req.originalUrl + ' '
        + '\033[' + color + 'm' + res.statusCode
        + ' \033[90m'
        + (new Date - req._startTime)
        + 'ms' + len
        + '\033[0m';
};

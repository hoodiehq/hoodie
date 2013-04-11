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
        function (req, res, next) {
            if (req.url.match(/^\/_api/)) {
                // pass requests to /_api to api server
                var new_url = req.url.replace(/^\/_api/, "");
                console.log(
                    "[www _api] %s %s ==> %s",
                    req.method, req.url, path.join(config.couch.url, new_url)
                );
                req.url = new_url;
                req.headers.host = config.couch.host;
                // call the API server's handler directly
                return config.api_server._events.request(req, res);
            }
            next();
        },
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

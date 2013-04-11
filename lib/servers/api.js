/**
 * Serves the API, proxying relevant requests to CouchDB
 */

var connect = require('connect'),
    cors_http = require("corsproxy"),
    http_proxy = require("http-proxy"),
    loggers = require('./loggers'),
    utils = require('../utils'),
    http = require('http');


/**
 * Starts a new HTTP server
 */

exports.start = function (config, callback) {
    // make sure there is a couch_url in the config
    if (!cfg.couch_url) {
        return callback(new Error(
            "Please set the COUCH_URL environment variable"
        ));
    }
    // set location of CouchDB
    cors_http.options = {
        target: config.couch.url
    };

    // wrap cors_http to log request to api
    var handler = function (req, res, proxy) {
        console.log('[api] %s %s', req.method, req.url);
        return cors_http(req, res, proxy);
    };

    var host = config.host,
        port = config.api_server.port;

    return http_proxy.createServer(handler).listen(port, host, utils.announce(
        'API started:   http://' + host + ':' + port,
        callback
    ));
};

/**
 * Stops the provided HTTP server
 */

exports.stop = function (server, callback) {
    server.close(callback);
};

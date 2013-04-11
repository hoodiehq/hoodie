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
    if (!config.couch.url) {
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

    // host for the API server (not CouchDB)
    var host = config.host,
        port = config.api_server.port;

    var server = http_proxy.createServer(handler);
    config.api_server = server; // used by www to send /_api reqs here

    return server.listen(port, host, utils.announce(
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

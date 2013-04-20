/**
 * Serves the API, proxying relevant requests to CouchDB
 */

var http_proxy = require("http-proxy");


module.exports = function (config) {
    // make sure the couch host and port are set in config
    if (!config.couch.host || !config.couch.port) {
        return callback(new Error(
            "Please set the COUCH_URL environment variable"
        ));
    }

    // where to send requests
    var target = {
        port: config.couch.port,
        host: config.couch.host
    };

    // create a http proxy to CouchDB
    var proxy = new http_proxy.RoutingProxy({
        changeOrigin: true
    });

    // return the proxy handler
    return function (req, res, next) {
        // ignore non-api requests
        if (!/^\/_api/.test(req.url)) {
            return next();
        }
        // remove the /_api part from url before proxying
        req.url = req.url.substr('/_api'.length);
        // proxy request to CouchDB
        proxy.proxyRequest(req, res, target);
    };
};

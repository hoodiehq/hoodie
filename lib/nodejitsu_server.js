/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var http_proxy = require("http-proxy");
    http = require('http'),
    url = require('url');


/**
 * Creates a proxy server to handle nodejitsu requests based on subdomain
 */

module.exports = function (config, callback) {
    if (!config.run_nodejitsu_server) {
        return callback();
    }
    // TODO: look at using http_proxy.createServer and options.router
    // instead of using custom url matching on the request
    var proxy = new http_proxy.RoutingProxy();

    // returns a http proxy server
    return http.createServer(function (req, res) {

        // proxy request to www server by default
        var port = config.www_port;

        if (/^admin\./.test(req.headers.host)) {
            // proxy request to admin server when hostname starts with admin.*
            port = config.admin_port;
        }

        // proxy the request
        proxy.proxyRequest(req, res, {
            host: config.host,
            port: port
        });

    }).listen(8080, config.host, callback);
};

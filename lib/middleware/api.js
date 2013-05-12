/**
 * Serves the API, proxying relevant requests to CouchDB
 */

var http_proxy = require('http-proxy'),
    config = require('../config'),
    request = require('request'),
    url = require('url'),
    _ = require('underscore');


module.exports = function (cfg, admin_api) {
    // make sure the couch host and port are set in cfg
    if (!cfg.couch.host || !cfg.couch.port) {
        return callback(new Error(
            'Please set the COUCH_URL environment variable'
        ));
    }

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

        if (admin_api && !/^\/_session/.test(req.url)) {
            return proxyAdminRequest(cfg, proxy, req, res, next);
        }
        else {
            // proxy request to CouchDB
            proxy.proxyRequest(req, res, {
                host: cfg.couch.host,
                port: cfg.couch.port
            });
        }
    };
};

/**
 * Checks current CouchDB session of req object for specific role
 */

function hasRole(couch_url, req, role, callback) {
    var u = {
        url: url.resolve(couch_url, '/_session'),
        headers: {Cookie: req.headers.cookie},
        json: true
    };
    request(u, function (err, res, body) {
        if (err) {
            return callback(err);
        }
        if (!body.userCtx) {
            return callback(new Error('Bad session response: ' + body));
        }
        return callback(null, _.contains(body.userCtx.roles, role));
    });
};

/**
 * Checks if the user for the current request has appropriate role
 * for accessing admin /_api. If so, updates the request object to include
 * basic auth for the internal Hoodie admin user.
 */

function proxyAdminRequest(cfg, proxy, req, res, next) {
    var buffer = http_proxy.buffer(req);
    var role = 'hoodie-admin:' + cfg.id;
    hasRole(cfg.couch.url, req, role, function (err, got_role) {
        if (err) {
            return next(err);
        }
        if (got_role) {
            delete req.headers.cookie;
            config.getAdminPassword(cfg, function (err, password) {
                if (err) {
                    return callback(err);
                }
                var auth = cfg.couch.username + ':' + password;
                req.headers.authorization = 'Basic ' +
                    new Buffer(auth).toString('base64');

                // proxy request to CouchDB
                proxy.proxyRequest(req, res, {
                    host: cfg.couch.host,
                    port: cfg.couch.port,
                    buffer: buffer
                });
            });
        }
        else {
            // TODO: unauthorized
            var body = JSON.stringify({
                error: 'unauthorized',
                reason: 'You are not authorized to access this API.'
            });
            res.writeHead(401, {
                'Content-Length': body.length,
                'Content-Type': 'application/json'
            });
            return res.end(body);
        }
    });
}

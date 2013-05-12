/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var connect = require('connect'),
    loggers = require('./middleware/loggers'),
    cors = require('./middleware/cors'),
    api = require('./middleware/api'),
    hconsole = require('./hconsole'),
    http = require('http'),
    path = require('path');


/**
 * Creates a new http server start function
 */

module.exports = function (server_config) {
    return function (config, callback) {
        // Defines a new ConnectJS app
        var app = connect(
            loggers.dev(server_config.name),
            cors(),
            api(config, server_config.admin_api),
            connect.compress(),
            connect.static(server_config.root)
        );

        var host = server_config.host,
            port = server_config.port;

        return http.createServer(app).listen(port, host, hconsole.announce(
            server_config.message,
            callback
        ));
    };
}

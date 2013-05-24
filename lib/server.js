/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var connect = require('connect'),
    loggers = require('./middleware/loggers'),
    serve_file = require('./middleware/serve_file'),
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

        // the default file to serve when url does not match static file
        var default_file = path.resolve(
            server_config.root,
            server_config.default_file || 'index.html'
        );

        // Defines a new ConnectJS app
        var app = connect(
            loggers.dev(server_config.name),
            cors(),
            api(config),
            connect.compress(),
            connect.static(server_config.root),
            serve_file(default_file)
        );

        var server = http.createServer(app);
        // store in config.name_server property so the nodejitsu_server
        // can access it later if required
        config[server_config.name + '_server'] = server;

        if (server_config.listen) {
            var host = server_config.host,
                port = server_config.port;

            // start listening then call callback
            return server.listen(port, host, hconsole.announce(
                server_config.message,
                callback
            ));
        }
        else {
            // don't start listening
            return callback();
        }

    };
}

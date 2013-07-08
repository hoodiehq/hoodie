/**
 * Serves static assets for Hoodie plugins
 *
 * This should be put before the API server since it is a subpath and should
 * match the request first.
 */

var connect = require('connect'),
    dispatch = require('dispatch'),
    workers = require('../workers'),
    path = require('path');


module.exports = function (config) {
    var names = workers.getWorkerNames(config.app);
    var pockets = names.reduce(function (acc, name) {
        acc[name] = connect.static(
            path.resolve(
                config.project_dir,
                'node_modules',
                'hoodie-worker-' + name,
                'pocket'
            )
        );
        return acc;
    },
    {});
    return dispatch({
        '/_api/_plugins': {
            'GET': function (req, res, next) {
                // list all plugins and metadata
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end('{"all": "plugins"}');
            },
            'GET /:name': function (req, res, next, name) {
                // list single plugin metadata and config
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end('{"one": "plugin"}');
            },
            'PUT /:name/config': function (req, res, next, name) {
                // update plugin config
            },
            'GET /:name/pocket/(.*)': function (req, res, next, name, path) {
                function notFound() {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.end();
                }
                // serve static assets for pocket
                var w = pockets[name];
                if (!w) {
                    return notFound();
                }
                req.url = '/' + path;
                return w(req, res, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return notFound();
                });
            }
        }
    });
};

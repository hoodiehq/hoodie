/**
 * Serves static assets for Hoodie plugins
 *
 * This should be put before the API server since it is a subpath and should
 * match the request first.
 */

var connect = require('connect'),
    dispatch = require('dispatch'),
    workers = require('../workers'),
    couch = require('../couch'),
    path = require('path'),
    url = require('url'),
    _ = require('underscore');


module.exports = function (config) {
    var modules = workers.getWorkerModuleNames(config.app);
    var metadata = modules.map(function (m) {
        return workers.readMetadata(config, m);
    });
    var pockets = modules.reduce(function (acc, mod) {
        acc[workers.workerModuleToName(mod)] = connect.static(
            path.resolve(config.project_dir, 'node_modules', mod, 'pocket')
        );
        return acc;
    }, {});

    function notFound(res) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end();
    }

    return dispatch({
        '/_api/_plugins': {
            'GET /?': function (req, res, next) {
                // list all plugins and metadata
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(metadata));
            },
            'GET /:name': function (req, res, next, name) {
                // list single plugin metadata and config
                var m = _.detect(metadata, function (m) {
                    return m.name === name;
                });
                if (!m) {
                    return notFound(res);
                }
                // clone the data because we're going to extend it with config
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(m));
            },
            'GET /:name/pocket/(.*)': function (req, res, next, name, path) {
                // serve static assets for pocket
                var w = pockets[name];
                if (!w) {
                    return notFound(res);
                }
                req.url = '/' + path;
                return w(req, res, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return notFound(res);
                });
            }
        }
    });
};

/**
 * Static file server providing the Hoodie admin interface
 */

var connect = require('connect'),
    utils = require('../utils');


module.exports = function (config) {
    // Hoodie admin static resources location
    var static_dir = path.resolve(
        __dirname, '../../node_modules/hoodie-pocket/www'
    );

    // static files with gzip compression
    var serve = connect(
        connect.compress(),
        connect.static(static_dir)
    );

    // connect handler
    return function (req, res, next) {
        // ignore requests not part of admin interface
        if (!/^\/_admin/.test(req.url)) {
            return next();
        }
        // remove the /_admin part of the url when matching filenames
        req.url = req.url.substr('/_admin'.length);

        if (!req.url) {
            // add trailing slash if missing
            return utils.redirect('/_admin/', res);
        }
        return serve(req, res, next);
    };
};

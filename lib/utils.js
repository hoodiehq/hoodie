var open = require('open');
var mkdirp = require('mkdirp');


/**
 * Ensures a directory exists using mkdir -p.
 *
 * @param {String} path
 * @param {Function} callback
 * @api public
 */

exports.ensureDir = function (path, callback) {
    mkdirp(path, callback);
};

/**
 * Creates a deep-clone of a JSON-serializable object
 *
 * @param obj - the object to serialize
 * @api public
 */

exports.jsonClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Send a 302 (Found) redirect response for a HTTP Server
 * Request object
 */

exports.redirect = function (loc, res) {
    res.writeHead(302, {Location: loc});
    return res.end(
        '<html>' +
            '<head>' +
                '<title>302 Found</title>' +
            '</head>' +
            '<body>' +
                '<p>' +
                    'Found: <a href="' + loc + '">' + loc + '</a>' +
                '</p>' +
            '</body>' +
        '</html>'
    );
};

/**
 * Opens browser with app
 */
exports.openBrowser = function (config, callback) {
    // don’t open if configured not to (like on nodejitsu)
    if (!config.open_browser) {
        return callback();
    }

    var url = 'http://' + config.host + ':' + config.www_port;

    open(url, null, callback);
};

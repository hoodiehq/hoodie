/**
 * Static file server providing the project's www resources
 */

var connect = require('connect');


module.exports = function (config) {
    // project's www directory location
    var static_dir = path.resolve(config.project_dir, 'www');

    // static files with gzip compression
    return connect(
        connect.compress(),
        connect.static(static_dir)
    );
};

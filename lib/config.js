/**
 * Stores and retrieves config values for the application
 */

var npm = require('npm');


/**
 * Gets the CouchDB admin password stored in NPM for a given app name
 */

exports.getAdminPassword = function (app_name, callback) {
    npm.load(function (err, npm) {
        if (err) {
            return callback(err);
        }
        var password = (
            npm.config.get(app_name + '_admin_pass') ||
            process.env['HOODIE_ADMIN_PASS']
        );
        // toString, otherwise only digit passwords fail
        return callback(null, password.toString());
    });
};

/**
 * Sets the CouchDB admin password
 */

exports.setAdminPassword = function (app_name, password, callback) {
    npm.load(function (err, npm) {
        if (err) {
            return callback(err);
        }
        var result = npm.commands.config([
            'set', app_name + '_admin_pass', password
        ]);
        callback(null, password);
    });
};

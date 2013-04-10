/**
 * Sets up CouchDB admin and Hoodie related dbs
 */

var request = require("request"),
    prompt = require('prompt'),
    async = require('async'),
    npm = require('npm');


/**
 * Checks CouchDB for required users/dbs, prompts user for info
 * where appropriate
 */

exports.install = function (config, callback) {
    async.applyEachSeries([
        exports.pollCouch,
        exports.checkPassword
    ],
    config, function (err) {
        if (err) {
            return callback(err);
        }
        console.log(''); // line break before server info
        callback();
    });
};

/**
 * Ensures an admin password has been set and prompts for one
 * if missing
 */

exports.checkPassword = function (config, callback) {
    exports.isAdminParty(config, function (err, party) {
        if (err) {
            return callback(err);
        }
        if (party) {
            // if we're in admin party, ask user for password
            exports.getPassword(function (err, password) {
                if (err) {
                    return callback(err);
                }
                // set couchdb admin password
                exports.setPassword(config, password, callback)
            });
        }
        else {
            // couchdb admin password already set
            return callback();
        }
    });
}

/**
 * Prompts the user for a password and reads it without outputting
 * characters to the terminal
 */

exports.getPassword = function (callback) {
    prompt.get({
        description: 'Please set an admin password: ',
        name: 'password',
        hidden: true
    },
    function (err, result) {
        return callback(err, result && result.password);
    });
};

/**
 * Checks if CouchDB is in admin party mode
 */

exports.isAdminParty = function (config, callback) {
    request(config.couch.url + '/_users/_all_docs', function (err, res) {
        if (err) {
            return callback(err);
        }
        callback(null, res.statusCode !== 403);
    });
};

/**
 * Polls CouchDB during startup so we know when we can make
 * requests against it
 */

exports.pollCouch = function (config, callback) {
    // when to stop polling and give up!
    var end = new Date().getTime() + 10000; // 10 second timeout

    process.stdout.write('Waiting for CouchDB..');

    function _poll() {
        request(config.couch.url, function (err, res) {
            if (err && err.code === 'ECONNREFUSED') {
                // CouchDB not available yet
                if (new Date().getTime() >= end) {

                    // Exceeded timeout value
                    process.stdout.write('\n');
                    return callback(new Error(
                        'Timed out waiting for CouchDB, please check ' +
                        path.resolve(config.hoodie.app_dir, 'couch.log')
                    ));
                }
                // wait and try again
                process.stdout.write('.');
                return setTimeout(_poll, 100);
            }
            // We got a response!
            process.stdout.write(' done!\n');
            return callback();
        });
    }

    // start polling
    _poll();
};

/**
 * Sets the admin password on CouchDB
 */

exports.setPassword = function (config, password, callback) {
    request({
        url: config.couch.url + '/_config/admins/admin',
        method: 'PUT',
        body: '"' + password + '"'
    },
    function (err) {
        if (err) {
            return callback(err);
        }
        npm.load(function (err, npm) {
            if (err) {
                return callback(err);
            }
            var result = npm.commands.config([
                'set', config.app.name + '_admin_pass', password
            ]);
            callback();
        });
    });
};

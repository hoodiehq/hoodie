var child_process = require('child_process');

/**
 * Ensures a directory exists using mkdir -p.
 *
 * @param {String} path
 * @param {Function} callback
 * @api public
 */

exports.ensureDir = function (path, callback) {
    var mkdir = child_process.spawn('mkdir', ['-p', path]);
    var err_data = '';
    mkdir.stderr.on('data', function (data) {
        err_data += data.toString();
    });
    mkdir.on('exit', function (code) {
        if (code !== 0) {
            return callback(new Error(err_data));
        }
        callback();
    });
};

/**
 * Wraps a callback with a message to print on success
 * (no error argument passed to it)
 *
 * @param {String} msg - the message to display on success
 * @param {Function} fn - the callback to wrap
 * @api public
 */

exports.announce = function (msg, fn) {
    return function (err) {
        if (err) {
            return fn.apply(this, arguments);
        }
        console.log(msg);
        return fn.apply(this, arguments);
    };
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

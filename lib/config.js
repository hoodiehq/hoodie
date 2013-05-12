/**
 * Stores and retrieves config values for the application
 */

var fs = require('fs'),
    path = require('path'),
    Lock = require('lock'),
    async = require('async');


/**
 * Used to lock access to config.json file when updating
 */

var lock = Lock()

/**
 * Returns the location of the config.json file for given environment
 */

exports.path = function (cfg) {
    return path.resolve(cfg.hoodie.app_path, 'config.json');
};

/**
 * Reads all values from config.json for the given environment
 */

exports.read = function (cfg, callback) {
    fs.readFile(exports.path(cfg), function (err, data) {
        if (err) {
            // when config.json does not exist, return empty object
            if (err.code === 'ENOENT') {
                return callback(null, {});
            }
            return callback(err);
        }
        try {
            var obj = JSON.parse(data.toString());
        }
        catch (e) {
            return callback(e);
        }
        return callback(null, obj);
    });
};

/**
 * Writes obj to config.json file for the given environment
 */

exports.write = function (cfg, obj, callback) {
    try {
        var data = JSON.stringify(obj, null, 4);
    }
    catch (e) {
        return callback(e);
    }
    var p = exports.path(cfg);
    async.series([
        async.apply(fs.writeFile, p + '.tmp', data),
        async.apply(fs.rename, p + '.tmp', p)
    ],
    callback);
};

/**
 * Reads a config.json value for the given environment
 */

exports.get = function (cfg, prop, callback) {
    exports.read(cfg, function (err, obj) {
        if (err) {
            return callback(err);
        }
        try {
            var value = exports.getProperty(obj, prop);
        }
        catch (e) {
            return callback(e);
        }
        return callback(null, value);
    });
};

/**
 * Sets a config.json value for the given environment
 */

exports.set = function (cfg, prop, value, callback) {
    // wait on lock for current app
    lock(cfg.app.id, function (release) {

        // release lock when callback is called
        callback = release(callback);

        exports.read(cfg, function (err, obj) {
            if (err) {
                return callback(err);
            }
            try {
                exports.setProperty(obj, prop, value);
            }
            catch (e) {
                return callback(e);
            }
            return exports.write(cfg, obj, callback);
        });
    });
};

/**
 * Gets the CouchDB admin password stored in config.json for a given app name
 */

exports.getAdminPassword = function (cfg, callback) {
    exports.get(cfg, ['couchdb', 'password'], function (err, password) {
        if (err) {
            return callback(err);
        }
        return callback(null, password || process.env['HOODIE_ADMIN_PASS']);
    });
};

/**
 * Sets the CouchDB admin password
 */

exports.setAdminPassword = function (cfg, password, callback) {
    exports.set(cfg, ['couchdb', 'password'], password, callback);
};

/**
 * Walks an array of nested property names and assigns a value. Creates
 * sub-objects if required.
 *
 * Example: {}, ['foo', 'bar', 'baz'], 123 => {foo: {bar: {baz: 123}}}
 */

exports.setProperty = function (obj, parts, val) {
    if (!Array.isArray(parts)) {
        parts = [parts];
    }
    var curr = [];

    // loop through all parts of the path except the last, creating the
    // properties if they don't exist
    var prop = parts.slice(0, parts.length - 1).reduce(function (a, x) {
        curr.push(x);
        if (a[x] === undefined) {
            a[x] = {};
        }
        if (typeof a[x] === 'object' && !Array.isArray(a[x])) {
            a = a[x];
        }
        else {
            throw new Error(
                'Updating "' + p + '" would overwrite "' +
                    curr.join('.') + '"\n'
            );
        }
        return a;
    }, obj);

    // set the final property to the given value
    prop[parts[parts.length - 1]] = val;

    return val;
};

/**
 * Walks the properties of an object to return a value. Pass invalid=true
 * to avoid throwing on non-existent property name.
 */

exports.getProperty = function (obj, parts, /*optional*/invalid) {
    if (!Array.isArray(parts)) {
        parts = [parts];
    }
    // if path is empty, return the root object
    if (!parts.length) {
        return obj;
    }

    // loop through all parts of the path, throwing an exception
    // if a property doesn't exist
    for (var i = 0; i < parts.length; i++) {
        var x = parts[i];
        if (obj[x] === undefined) {
            if (invalid) {
                return undefined;
            }
            throw new Error('Invalid property: ' + parts.join('.'));
        }
        obj = obj[x];
    }
    return obj;
};

var child_process = require('child_process'),
    clc = require('cli-color');

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
 * Print a new line when processing a list of async functions. Only works for
 * iterators that rely on side effects (applyAll, series, parallel, each, etc),
 * as it doesn't return any value.
 */

exports.linebreak = function () {
    var callback = arguments[arguments.length-1];
    console.log('');
    return callback();
};

/**
 *
 */

exports.console_spinner = function (msg, end_time) {
    var width = 6;

    var desc = false;
    var pos = 0;

    function bar() {
        var str = '';
        for (var i = 0; i < width; i++) {
            str += (i === pos) ? '*': clc.blackBright('-');
        }
        return '[' + str + ']';
    }

    function timer() {
        var now = new Date().getTime();
        var diff = end_time - now;
        var secs = Math.ceil(diff / 1000);
        return secs + 's';
    }

    function draw(state) {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        if (desc) {
            if (pos > 0) {
                --pos;
            }
            else {
                desc = false;
                ++pos;
            }
        }
        else {
            if (pos < width - 1) {
                ++pos;
            }
            else {
                desc = true;
                --pos;
            }
        }
        process.stdout.write(
            [msg, bar(), state || timer(), ''].join(' ')
        );
    }

    var t = setInterval(draw, 300);

    function stop(state) {
        clearInterval(t);
        draw(state);
        console.log('');
    }

    return {
        stop: stop,
        success: function () {
            stop('SUCCESS');
        },
        failed: function () {
            stop('FAILED');
        }
    };
};

/**
 *
 */

exports.displayError = function (err) {
    if (err.message) {
        var lines = err.message.split('\n').map(function (line) {
            return clc.bgBlack.red('ERR!') + ' ' + line;
        });
        console.error('\n' + lines.join('\n'));
    }
    else {
        console.error(err.toString());
    }
};

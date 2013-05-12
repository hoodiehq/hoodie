/**
 * Utilities for Hoodie's console output
 */

var clc = require('cli-color');


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
 * Displays an indicator while waiting for a task, with an optional
 * countdown to a timeout.
 */

exports.spinner = function (msg, /*optional*/end_time) {
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
        if (end_time) {
            var now = new Date().getTime();
            var diff = end_time - now;
            var secs = Math.ceil(diff / 1000);
            return secs + 's';
        }
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
 * Prefixes the error's message with 'ERR!' where possible
 * and prints to console.error
 */

exports.error = function (err) {
    var str = err.stack || err.message || err.toString();
    var lines = str.split('\n').map(function (line) {
        return clc.bgBlack.red('ERR!') + ' ' + line;
    });
    console.error('\n' + lines.join('\n'));
};

/**
 * Outputs the Hoodie logo in color ascii art
 */

exports.logo = function () {
    var lines = [
        [".d$b.  .d$b.", "  .d$$$$$$b.  ", "  .d$$$$$$b.  ", ".d$$$$$$b.  ",  ".d$b.", ".d$$$$$$$$b."],
        ["$$$$$..$$$$$", ".$$$$$$$$$$$b ", ".$$$$$$$$$$$b ", "$$$$$$$$$$b ",  "$$$$$", "$$$$$$$$$$P'"],
        ["$$$$$$$$$$$$", "d$$$$$$$$$$$$b", "d$$$$$$$$$$$$b", "$$$$$$$$$$$b",  "$$$$$", "$$$$$$$$$$b."],
        ["$$$$$$$$$$$$", "Q$$$$$$$$$$$$P", "Q$$$$$$$$$$$$P", "$$$$$$$$$$$P",  "$$$$$", "$$$$$$$$$$P'"],
        ["$$$$$´`$$$$$", "'$$$$$$$$$$$$'", "'$$$$$$$$$$$$'", "$$$$$$$$$$P ",  "$$$$$", "$$$$$$$$$$b."],
        ["'Q$P'  'Q$P'", "  'Q$$$$$$P'  ", "  'Q$$$$$$P'  ", "'Q$$$$$$$P  ",  "'Q$P'", "'Q$$$$$$$$P'"],
        ["", "", "", "",  "", ""],
        [" Hi!", "", "", "",  "", ""]
    ];
    var logo = lines.map(function (line) {
        var blue = clc.xterm(25);
        var green = clc.xterm(28);
        var yellow = clc.xterm(214);
        var orange = clc.xterm(202);
        var brown = clc.xterm(240);
        var red = clc.xterm(160);
        return blue(line[0]) +
            green(line[1]) +
            yellow(line[2]) +
            orange(line[3]) +
            brown(line[4]) +
            red(line[5]);
    }).join('\n');

    console.log('\n' + logo + '\n');
};

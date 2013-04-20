/**
 * ConnectJS compatible log functions
 */

var bytes = require('bytes'),
    connect = require('connect');


/**
 * Development logger with color output and response times
 */

exports.dev = function (server_name) {
    return connect.logger(function (tokens, req, res) {
        var status = res.statusCode,
            len = parseInt(res.getHeader('Content-Length'), 10),
            color = 32;

        if (status >= 500) color = 31
        else if (status >= 400) color = 33
        else if (status >= 300) color = 36;

        len = isNaN(len) ? '' : len = ' - ' + bytes(len);

        return '\033[90m' + '[' + server_name + '] ' + req.method
            + ' ' + req.originalUrl + ' '
            + '\033[' + color + 'm' + res.statusCode
            + ' \033[90m'
            + (new Date - req._startTime)
            + 'ms' + len
            + '\033[0m';
    });
};

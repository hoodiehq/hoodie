/**
 * ConnectJS compatible log functions
 */

var bytes = require('bytes');
var hapi = require('hapi');


/**
 * Development logger with color output and response times
 */

exports.dev = function (server_name) {

  return hapi.on('log', function (req, res) {
    var status = res.statusCode,
        len = parseInt(res.getHeader('Content-Length'), 10),
        color = 32;

    if (status >= 500) {
      color = 31;
    } else if (status >= 400) {
      color = 33;
    } else if (status >= 300) {
      color = 36;
    }

    len = isNaN(len) ? '' : len = ' - ' + bytes(len);
    var date = new Date();

    var logStr = '\033[90m' + date.toISOString() + ' [';
    logStr +=  server_name + '] ' + req.method + ' ';
    logStr += '\033[' + color + 'm' + res.statusCode + '\033[90m';
    logStr += ' ' + req.originalUrl + ' ';
    logStr += (new Date() - req._startTime);
    logStr += 'ms' + len;
    logStr += '\033[0m';

    return logStr;

  });

};

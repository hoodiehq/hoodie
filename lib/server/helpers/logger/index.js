var bytes = require('bytes');

exports.register = function (plugin, options, next) {

  plugin.ext('onRequest', function (request, extNext) {

    var status = request.raw.res.statusCode;
    var len = parseInt(request.headers['Content-Length'], 10);
    var color = 32;

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
    logStr +=  /* admin.settings.labels[0] + */'] ' + request.raw.req.method + ' ';
    logStr += '\033[' + color + 'm' + status + '\033[90m';
    logStr += ' ' + request.path + ' ';
    logStr += (Date.now() - request.info.received);
    logStr += 'ms' + len;
    logStr += '\033[0m';

    console.log(logStr);

    extNext();
  });

  return next();
};


var bytes = require('bytes');

exports.register = function (plugin, options, next) {
  plugin.on('response', function (request) {
    if (!options.app.verbose) {
      return;
    }

    var response = request.response;
    var status = response.statusCode;
    var len = parseInt(response.headers['content-length'], 10);
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
    logStr +=  /* admin.settings.labels[0] + */'] ' + request.method.toUpperCase() + ' ';
    logStr += '\033[' + color + 'm' + status + '\033[90m';
    logStr += ' ' + request.url.path + ' ';
    logStr += (date.getTime() - request.info.received);
    logStr += 'ms' + len;
    logStr += '\033[0m';

    console.log(logStr);
  });

  return next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};


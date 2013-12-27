/**
 * Serves static assets and proxies /_api requests to couchdb
 */

var Hapi = require('hapi');

/**
 * Creates a new http server start function
 */

module.exports = function (server_config) {

  return function (config, callback) {

    var pack = new Hapi.Pack();

    pack.server(server_config.www_port, {
      labels: ['web'],
      cors: true
    });

    pack.server(server_config.admin_port, {
      labels: ['admin'],
      cors: true
    });

    pack.require('./plugins/web', {
      app: config,
      www_root: server_config.www_root,
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
      console.log('WWW:   ', server_config.www_link());
    });

    pack.require('./plugins/admin', {
      app: config,
      admin_root: server_config.admin_root,
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
      console.log('Admin: ', server_config.admin_link());
    });

    pack.require('./plugins/api', {
      app: config,
    }, function (err) {
      if (err) {
        console.log('err', err);
      }
    });

    //pack.require('good', {
      //subscribers: {
        //'console': ['request', 'ops', 'log', 'error']
      //}
    //}, function (err) {
      //if (err) {
        //console.log('err', err);
      //}

    //});

    var web = pack._servers[0];
    var admin = pack._servers[1];

    admin.on('request', function (request, event, tags) {

      if (tags.received) {
        //console.log('resp time', event.responseTime);

        var bytes = require('bytes');
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
        logStr +=  admin.settings.labels[0] + '] ' + request.raw.req.method + ' ';
        logStr += '\033[' + color + 'm' + status + '\033[90m';
        logStr += ' ' + event.data.url + ' ';
        //logStr += (new Date() - request.raw.req._startTime);
        logStr += 'ms' + len;
        logStr += '\033[0m';

        console.log(logStr);
      }

    });
    //admin.on('request', function (request, event, tags) {
      //console.log('>>>>>>>>>>>>>>>>>>>>>>>>', request, event, tags);
    //});

    pack.start(function () {
      return callback();
    });

  };

};


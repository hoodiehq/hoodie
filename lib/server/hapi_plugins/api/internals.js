var path = require('path');

var Wreck = require('wreck');

var hoodiejs = require('../../../helpers/pack_hoodie');

module.exports = {
  addCorsAndBearerToken: function (err, res, request, reply) {
    if (err) {
      reply(err).code(500);
      return;
    }

    Wreck.read(res, {
      json: true
    }, function (err, data) {
      var resp;
      var allowedHeaders = [
        'authorization',
        'content-length',
        'content-type',
        'if-match',
        'if-none-match',
        'origin',
        'x-requested-with'
      ];

      function addAllowedHeaders (arr) {
        for (var i = 0; i < arr.length; i++) {
          if (allowedHeaders.indexOf(arr[i].trim().toLowerCase()) === -1) {
            allowedHeaders.push(arr[i].trim().toLowerCase());
          }
        }
      }

      if (err) {
        reply(err).code(500);
        return;
      }

      var isSess = request.method === 'post' && request.path === '/_api/_session';

      if (data && isSess && Array.isArray(res.headers['set-cookie'])) {
        data.bearerToken = extractToken(res.headers['set-cookie']);
        delete res.headers['set-cookie'];
      }

      addAllowedHeaders(Object.keys(request.headers));

      if (request.method === 'options') {
        res.statusCode = 200;
        if (request.headers['Allow-Control-Request-Headers']) {
          addAllowedHeaders(request.headers['Allow-Control-Request-Headers'].split(','));
        }
      }

      // hapi eats newlines. We like newlines. For POSIX and such.
      // data = data + '\n';
      resp = reply(data).code(res.statusCode).hold();
      resp.headers = res.headers;
      resp.headers['content-length'] = data ? data.length : 0;
      resp.headers['access-control-allow-origin'] = request.headers.origin || '*';
      resp.headers['access-control-allow-headers'] = allowedHeaders.join(', ');
      resp.headers['access-control-expose-headers'] = 'content-type, content-length, etag';
      resp.headers['access-control-allow-methods'] = 'GET, PUT, POST, DELETE';
      resp.headers['access-control-allow-credentials'] = 'true';
      resp.send();
    });
  },
  extractToken: extractToken,
  getHoodiePath: function (options, request, reply) {
    reply(hoodiejs(options.app))
    .type('application/javascript')
    .header(
      'Pragma', 'no-cache'
    );
  },
  handlePluginRequest: function (options, request, reply) {
    var hooks = options.app.hooks;
    var pluginName = request.params.name;
    if (!pluginName) {
      notFound(request, reply);
      return;
    }

    // the plugin is now responsible to call `reply()`
    hooks.runDynamicForPlugin(pluginName, 'server.api.plugin-request', [request, reply]);
  },
  mapProxyPath: function (couchCfg, request, callback) {
    //use the bearer token as the cookie AuthSession for couchdb:
    if (request.headers.authorization && request.headers.authorization.substring(0, 'Bearer '.length) === 'Bearer ') {
      request.headers.cookie = 'AuthSession=' + request.headers.authorization.substring('Bearer '.length);
    } else {
      delete request.headers.cookie;
    }
    request.headers.host = [couchCfg.host, couchCfg.port].join(':');
    callback(null, couchCfg.url + request.url.path.substr('/_api'.length), request.headers);
  },
  notFound: notFound,
  uiKitPath: path.dirname(require.resolve('hoodie-admin-dashboard-uikit/dist/index.html'))
};

function extractToken (cookieHeader) {
  var result = (/AuthSession=(.*); Version(.*)/).exec(cookieHeader[0]);
  if (Array.isArray(result)) {
    return result[1];
  }
}

function notFound (request, reply) {
  reply({
    'error': 'not found'
  }).code(404);
}

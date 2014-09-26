var _ = require('lodash/dist/lodash.underscore');
var path = require('path');
var Wreck = require('wreck');

var hoodiejs = require('../../../helpers/pack_hoodie');
var plugins = require('../../../helpers/plugin_api');

var internals = {
  uiKitPath: '/node_modules/hoodie-server/node_modules/hoodie-admin-dashboard-uikit/dist/',
  mapProxyPath: function (request, callback) {
    //use the bearer token as the cookie AuthSession for couchdb:
    if (request.headers.authorization && request.headers.authorization.substring(0, 'Bearer '.length) === 'Bearer ') {
      request.headers.cookie = 'AuthSession=' + request.headers.authorization.substring('Bearer '.length);
    } else {
      delete request.headers.cookie;
    }
    callback(null, internals.couchCfg.url + request.url.path.substr('/_api'.length), request.headers);
  },
  notFound: function (request, reply) {
    reply({
      'error': 'not found'
    }).code(404);
  },
  extractToken: function (cookieHeader) {
    var result = (/AuthSession=(.*); Version(.*)/).exec(cookieHeader[0]);
    if (Array.isArray(result)) {
      return result[1];
    }
  },
  addCorsAndBearerToken: function (err, res, request, reply) {
    if (err) {
      reply(err).code(500);
      return;
    }
    Wreck.read(res, null, function (err, body) {
      var allowedHeaders = ['authorization', 'content-length', 'content-type', 'if-match', 'if-none-match', 'origin', 'x-requested-with'];
      var data, resp;

      function addAllowedHeaders(arr) {
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
      // TODO: https://github.com/hoodiehq/hoodie-server/issues/322
      try {
        data = JSON.parse(body);
      } catch(e) {
        data = {};
      }
      if (Array.isArray(res.headers['set-cookie'])) {
        data.bearerToken = internals.extractToken(res.headers['set-cookie']);
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
      data = JSON.stringify(data) + '\n';

      resp = reply(data).code(res.statusCode).hold();
      resp.headers = res.headers;
      resp.headers['access-control-allow-origin'] = request.headers.origin || '*';
      resp.headers['access-control-allow-headers'] = allowedHeaders.join(', ');
      resp.headers['access-control-expose-headers'] = 'content-type, content-length, etag';
      resp.headers['access-control-allow-methods'] = 'GET, PUT, POST, DELETE';
      resp.headers['access-control-allow-credentials'] = 'true';
      resp.send();
    });
  }
};

exports.register = function (plugin, options, next) {
  // FIXME: have to define these three internals here,
  //     because they rely on `options` being defined.
  //     This means we can't write unit tests for them,
  //     and it's also in itself ugly. Is there a nicer
  //     way of doing this?
  internals.couchCfg = options.app.couch;
  internals.handlePluginRequest = function (request, reply) {

    var hooks = options.app.hooks;
    var pluginName = request.params.name;
    if (!pluginName) {
      internals.notFound(request, reply);
      return;
    }

    var ran_hook = hooks.runDynamicForPlugin(pluginName, 'server.api.plugin-request', [request, reply]);

    if (!ran_hook) {
      internals.notFound(request, reply);
    }
  };
  internals.getHoodiePath = function (request, reply) {
    reply(hoodiejs(options.app))
    .type('application/javascript')
    .header(
      'Pragma', 'no-cache'
    );
  };

  plugin.route([
    {
      method: 'OPTIONS',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath,
          onResponse: internals.addCorsAndBearerToken
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_all_dbs',
      handler: internals.notFound
    },
    {
      method: 'GET',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath,
          onResponse: internals.addCorsAndBearerToken
        }
      }
    },
    {
      method: 'PUT',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath,
          onResponse: internals.addCorsAndBearerToken
        }
      }
    },
    {
      method: 'POST',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath,
          onResponse: internals.addCorsAndBearerToken
        }
      }
    },
    {
      method: 'DELETE',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath,
          onResponse: internals.addCorsAndBearerToken
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins',
      handler: function (req, res) {
        res(plugins.metadata(options.app));
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}',
      handler: function (request, reply) {
        var metaData = _.find(plugins.metadata(options.app), function (doc) {
          return doc.name === request.params.name;
        });

        if (!metaData) {
          reply({
            'error': 'not found'
          }).code(404);
        } else {
          reply(metaData);
        }
      }
    },
    {
      method: 'HEAD',
      path: '/_api/_plugins/{name}/_api/{p*}',
      handler: internals.handlePluginRequest
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}/_api/{p*}',
      handler: internals.handlePluginRequest
    },
    {
      method: 'PUT',
      path: '/_api/_plugins/{name}/_api/{p*}',
      handler: internals.handlePluginRequest
    },
    {
      method: 'POST',
      path: '/_api/_plugins/{name}/_api/{p*}',
      handler: internals.handlePluginRequest
    },
    {
      method: 'DELETE',
      path: '/_api/_plugins/{name}/_api/{p*}',
      handler: internals.handlePluginRequest
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}/admin-dashboard',
      handler: function (req, res) {
        res.redirect('/');
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}/admin-dashboard/{path*}',
      handler: {
        directory: {
          path: function (request) {
            return plugins.admin_dashboards(options.app)[request.params.name];
          },
          listing: false,
          index: true
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/_assets/{path*}',
      handler: {
        directory: {
          path: function () {
            var projectDir = options.app.project_dir;
            var uiKitPath = internals.uiKitPath;
            if (projectDir.indexOf('hoodie-server') !== -1) {
              // we are running inside hoodie-server, e.g. in dev and test mode
              uiKitPath = uiKitPath.replace('/node_modules/hoodie-server', '');
            }
            var p = path.join(projectDir, uiKitPath);
            return p;
          },
          listing: true,
          index: false
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_files/hoodie.js',
      handler: internals.getHoodiePath
    }
  ]);

  return next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

//for unit tests:
exports.internals = internals;

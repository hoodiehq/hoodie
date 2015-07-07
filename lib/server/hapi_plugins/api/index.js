var _ = require('lodash');

var internals = require('./internals');
var plugins = require('../../../helpers/plugin_api');

exports.register = register;
exports.register.attributes = {
  name: 'api'
};

function register (server, options, next) {
  // allow clients to request a gzip response, even if the
  // Accept-Encoding headers is missing or mangled due to
  // faulty proxy servers
  // http://www.stevesouders.com/blog/2010/07/12/velocity-forcing-gzip-compression/
  server.ext('onPreHandler', function maybeForceGzip (request, reply) {
    if (request.query.force_gzip === 'true') {
      request.info.acceptEncoding = 'gzip';
    }
    reply.continue();
  });

  server.route([
    {
      method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath.bind(null, options.app.couch),
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
      path: '/_api/_plugins',
      handler: function (req, res) {
        res(plugins.metadata(options.app));
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}',
      handler: function (request, reply) {
        var metaData = _.find(
          plugins.metadata(options.app),
          'name',
          request.params.name);

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
      method: ['GET', 'PUT', 'POST', 'DELETE'],
      path: '/_api/_plugins/{name}/_api/{p*}',
      handler: internals.handlePluginRequest.bind(null, options)
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
          path: internals.uiKitPath,
          listing: true,
          index: false
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_files/hoodie.js',
      handler: internals.getHoodiePath.bind(null, options)
    }
  ]);

  return next();
}

var _ = require('lodash/dist/lodash.underscore');

var hoodiejs = require('../../../helpers/pack_hoodie');
var plugins = require('../../../helpers/plugin_api');

var fs = require('fs');

exports.register = function (plugin, options, next) {

  'use strict';

  var internals = {
    couchCfg: options.app.couch,
    mapProxyPath: function (request, callback) {
      callback(null, internals.couchCfg.url + request.url.path.substr('/_api'.length));
    },
    getHoodiePath: function (request, reply) {
      reply(hoodiejs(options.app))
      .type('application/javascript')
      .header(
        'Pragma', 'no-cache'
      );
    },
    notFound: function (request, reply) {
      reply({
        'error': 'not found'
      }).code(404);
    },
    handlePluginRequest: function (request, reply) {
      // look through plugins.pluginsWithApi() for {name}
      var name = request.params.name;
      console.log('handle plugin request for ' + name);
      var all_api_files = plugins.pluginsWithApi(options.app);
      console.log(all_api_files);
      if (!all_api_files[name]) {
        return internals.notFound(request, reply);
      }
      var api_file = all_api_files[name];
      console.log(api_file);
      if (!fs.existsSync(api_file)) {
        return internals.notFound(request, reply);
      }

      // require file for {name} // catch no-exist / no export
      try {
        var plugin = require(api_file);
        plugin(request, reply);
      } catch (e) {
        console.log('require or plugin failed')
        reply({
          error: e
        }).code(404);
      }
    }
  };

  plugin.route([
    {
      method: 'GET',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath
        }
      }
    },
    {
      method: 'PUT',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath
        }
      }
    },
    {
      method: 'POST',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath
        }
      }
    },
    {
      method: 'DELETE',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapProxyPath
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
      path: '/_api/_plugins/{name}/pocket',
      handler: function (req, res) {
        res.redirect('/');
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}/pocket/{path*}',
      handler: {
        directory: {
          path: function (request) {
            return plugins.pockets(options.app)[request.params.name];
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
          path: options.app.project_dir + '/node_modules/hoodie-server/node_modules/hoodie-pocket-uikit/dist',
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

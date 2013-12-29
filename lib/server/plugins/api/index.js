var Hapi = require('hapi');
var _ = require('underscore');

var hoodiejs = require('../../../helpers/pack_hoodie');
var plugins = require('../../../helpers/plugin_api');

exports.register = function (plugin, options, next) {

  'use strict';

  var internals = {
    couchCfg: options.app.couch,
    hoodiePath: function (request, reply) {
      var response = new Hapi.response.Text();
      response.message(hoodiejs(options.app), 'application/javascript', 'utf-8');
      return reply(response);
    },
    mapper: function (request, callback) {
      callback(null, internals.couchCfg.url + request.url.path.substr('/_api'.length));
    }
  };

  plugin.route([
    {
      method: 'GET',
      path: '/_api/',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_all_dbs',
      handler: function (request, reply) {
        reply({
          'error': 'not found'
        }).code(404);
      }
    },
    {
      method: 'POST',
      path: '/_api/',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/app/config',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_session/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'POST',
      path: '/_api/_session/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: '*',
      path: '/_session/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'DELETE',
      path: '/_api/_session/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_users/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_plugins/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: internals.mapper
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
            return plugins.pockets(options.app)[request.params.name] + '/';
          },
          listing: false,
          index: true
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_files/hoodie.js',
      handler: internals.hoodiePath
    }
  ]);

  return next();
};

var Hapi = require('hapi');

var hoodiejs = require('../../../helpers/pack_hoodie');
var plugins = require('../../../middleware/plugin_api');

exports.register = function (plugin, options, next) {

  'use strict';

  var couchCfg = options.app.couch;

  var hoodiePath = function (request, reply) {
    var response = new Hapi.response.Text();
    response.message(hoodiejs(options.app), 'application/javascript', 'utf-8');
    return reply(response);
  };

  var mapper = function (request, callback) {
    callback(null, couchCfg.url + request.url.path.substr('/_api'.length));
  };

  plugin.route([
    {
      method: 'GET',
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapper
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
      path: '/_api/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_session/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapper
        }
      }
    },
    {
      method: 'POST',
      path: '/_session/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapper
        }
      }
    },
    {
      method: '*',
      path: '/_users/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_plugins/{p*}',
      handler: {
        proxy: {
          passThrough: true,
          mapUri: mapper
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins',
      handler: function (req, res) {
        res(plugins.metadata(options.app));
        console.log(req.params.name);
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}',
      handler: function (req, res) {
        res(plugins.metadata(options.app));
        console.log(req.params.name);
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}/pocket',
      handler: function (req) {
        console.log(req.params.name);
      }
    },
    {
      method: 'GET',
      path: '/_api/_plugins/{name}/pocket/{path*}',
      handler: {
        directory: {
          path: function (request) {
            return options.admin_root + '/';
          },
          listing: false,
          index: true
        }
      }
    },
    {
      method: 'GET',
      path: '/_api/_files/hoodie.js',
      handler: hoodiePath
    }
  ]);

  return next();
};

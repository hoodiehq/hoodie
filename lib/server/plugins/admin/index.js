var path = require('path');

exports.register = function (plugin, options, next) {

  'use strict';

  plugin.select('admin').route([
    {
      method: 'GET',
      path: '/{p*}',
      handler: {
        directory: {
          path: path.relative(__dirname, options.admin_root),
          listing: false,
          index: true
        }
      }
    }
  ]);

  return next();
};

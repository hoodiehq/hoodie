exports.register = function (plugin, options, next) {

  'use strict';

  plugin.select('admin').route([
    {
      method: 'GET',
      path: '/{p*}',
      handler: {
        directory: {
          path: options.admin_root,
          listing: false,
          index: true
        }
      }
    }
  ]);

  return next();
};

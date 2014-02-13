exports.register = function (plugin, options, next) {

  'use strict';

  plugin.select('web').route([
    {
      method: 'GET',
      path: '/{p*}',
      handler: {
        directory: {
          path: options.www_root,
          listing: false,
          index: true
        }
      }
    }
  ]);

  return next();
};

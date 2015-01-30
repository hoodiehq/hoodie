exports.register = function (plugin, options, next) {

  plugin.select('web').route([
    {
      method: 'GET',
      path: '/{p*}',
      handler: {
        directory: {
          path: options.app.www_root,
          listing: false,
          index: true
        }
      }
    }
  ]);

  return next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};


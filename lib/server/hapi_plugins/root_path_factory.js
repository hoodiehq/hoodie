module.exports = function (name, root) {
  register.attributes = {
    name: name
  };

  function register (server, options, next) {

    server.select(name).route([
      {
        method: 'GET',
        path: '/{p*}',
        handler: {
          directory: {
            path: options.app[root],
            listing: false,
            index: true
          }
        }
      }
    ]);

    return next();
  }

  return register;
};

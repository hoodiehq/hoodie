exports.register = function (plugin, options, next) {

  plugin.ext('onPreResponse', function (request, reply) {

    var response = request.response;
    if (!response.isBoom) {
      return reply();
    }

    // on 404 for html requests, respond with index.html
    if (response.output.statusCode === 404) {
      if (request.headers.accept.match(/text\/html/)) {
        return reply.file(options.app.www_root + '/index.html');
      }
    }

    return reply();
  });

  return next();
};

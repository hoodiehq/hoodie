var fs = require('fs');
var path = require('path');

// https://github.com/spumko/hapi/blob/master/docs/Reference.md#plugin-interface
exports.register = function (plugin, options, next) {
  var indexFile = path.join(options.app.www_root, 'index.html');

  plugin.ext('onPostHandler', function (request, reply) {
    var response = request.response;

    if (!response.isBoom) { return reply.continue(); }

    var is404 = (response.output.statusCode === 404);
    var isHTML = /text\/html/.test(request.headers.accept);

    // We only care about 404 for html requests...
    if (!is404 || !isHTML) { return reply.continue(); }

    // Serve index.html
    reply(fs.createReadStream(indexFile));
  });

  next();

};

exports.register.attributes = {
  pkg: require('./package.json')
};


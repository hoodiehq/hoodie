var fs = require('fs');
var path = require('path');

exports.register = register;
exports.register.attributes = {
  name: 'handle_404'
};

function register (server, options, next) {
  var indexFile = path.join(options.app.www_root, 'index.html');

  server.ext('onPostHandler', function (request, reply) {
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
}

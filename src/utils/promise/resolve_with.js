var dfd = require('./defer');

module.exports = function resolveWith() {
  var deferred = dfd();

  deferred.resolve.apply(deferred, arguments);

  return deferred.promise;
};

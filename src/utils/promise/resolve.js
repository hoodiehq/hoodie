var dfd = require('./defer');

module.exports = function resolve() {
  var deferred = dfd();

  deferred.resolve();

  return deferred.promise;
};

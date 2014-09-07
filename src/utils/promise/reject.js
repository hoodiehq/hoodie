var dfd = require('./defer');

module.exports = function reject() {
  var deferred = dfd();

  deferred.reject();

  return deferred.promise;
};

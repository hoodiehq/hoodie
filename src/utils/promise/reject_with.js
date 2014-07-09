var dfd = require('./defer');
var HoodieError = require('../../lib/error/error');

module.exports = function rejectWith(errorProperties) {
  var error = new HoodieError(errorProperties);
  var deferred = dfd();

  deferred.reject(error);

  return deferred.promise;

};


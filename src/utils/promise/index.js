var HoodieError = require('../../lib/error/error');

// returns true if passed object is a promise (but not a deferred),
// otherwise false.
exports.isPromise = function (object) {
  return !!(object && typeof object.done === 'function' && typeof object.resolve !== 'function');
};

exports.defer = global.jQuery.Deferred;

exports.reject = function () {
  return exports.defer().reject().promise();
};

exports.rejectWith = function (errorProperties) {
  var error = new HoodieError(errorProperties);
  return exports.defer().reject(error).promise();
};

exports.resolve = function () {
  return exports.defer().resolve().promise();
};

exports.resolveWith = function () {
  return exports.defer().resolve.apply(exports.defer, arguments).promise();
};


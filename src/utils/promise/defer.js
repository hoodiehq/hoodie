var Promise = require('bluebird');

module.exports = function Defer () {
  var defer = this;

  // Backwards compatibility with jQuery Defer
  if (!(defer instanceof Defer)) {
    return new Defer();
  }

  var resolve, reject;
  var promise = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

  return {
      resolve: resolve,
      reject: reject,
      promise: promise
    };
};

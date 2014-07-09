var Promise = require('bluebird');

module.exports = function Defer() {
  var resolve, reject, promise;

  promise = new Promise(function () {
    resolve = arguments[0];
    reject = arguments[1];
  });

  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };

};


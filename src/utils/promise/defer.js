if (typeof global.Promise === 'function') {
  exports.Promise = global.Promise;
} else {
  exports.Promise = require('bluebird');
}

var Promise = exports.Promise;

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


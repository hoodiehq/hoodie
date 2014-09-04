/*jshint -W079 */
var Promise = exports.Promise = (function() {
  var PromiseClass;
  if (typeof global.Promise === 'function') {
    PromiseClass = global.Promise;
  } else {
    PromiseClass = require('bluebird');
  }
  PromiseClass.prototype.done = function done(callback) {
    this.then(callback);
    return this;
  };
  PromiseClass.prototype.fail = function fail(callback) {
    this.then(null, callback);
    return this;
  };
  PromiseClass.prototype.always = function always(callback) {
    this.then(callback, callback);
    return this;
  };
  PromiseClass.prototype.progress = function progress() {
    console.log('NOTE: promise.progress is currently not working');
    return this;
  };
  return PromiseClass;
})();

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

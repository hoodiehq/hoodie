/*jshint -W079 */
var Promise = exports.Promise = (function() {
  if (typeof global.Promise === 'function') {
    return global.Promise;
  }
  return require('bluebird');
})();

module.exports = function Defer() {
  var defer = {};
  defer.promise = new Promise(function (resolveCallback, rejectCallback) {
    defer.resolve = function resolve() {
      defer.notify = function noop () {};
      resolveCallback.apply(null, arguments);
    };
    defer.reject = function reject() {
      defer.notify = function noop () {};
      rejectCallback.apply(null, arguments);
    };
  });

  defer.promise._progressCallbacks = [];
  defer.notify = function notify() {
    var args = Array.prototype.slice.call(arguments);
    defer.promise._progressCallbacks.forEach(function(callback) {
      callback.apply(null, args);
    });
  };

  defer.promise.done = function done(callback) {
    this.then(callback);
    return this;
  };
  defer.promise.fail = function fail(callback) {
    this.then(null, callback);
    return this;
  };
  defer.promise.always = function always(callback) {
    this.then(callback, callback);
    return this;
  };
  defer.promise.progress = function progress(callback) {
    if (this._progressCallbacks) {
      this._progressCallbacks.push(callback);
    }
    return this;
  };

  return defer;
};

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

  // add done, fail, always, progress callbacks
  wrapPromise(defer.promise);

  defer.promise._progressCallbacks = [];
  defer.notify = function notify() {
    var args = Array.prototype.slice.call(arguments);
    defer.promise._progressCallbacks.forEach(function(callback) {
      callback.apply(null, args);
    });
  };

  return defer;
};

function wrapPromise (promise) {
  if (promise.done) {
    return promise;
  }

  promise.done = function done(callback) {
    this.then(callback);
    return this;
  };
  promise.fail = function fail(callback) {
    this.then(null, callback);
    return this;
  };
  promise.always = function always(callback) {
    this.then(callback, callback);
    return this;
  };
  promise.progress = function progress(callback) {
    if (this._progressCallbacks) {
      this._progressCallbacks.push(callback);
    }
    return this;
  };
  promise.then = function then (onResolve, onReject) {
    promise = Promise.prototype.then.call(this, onResolve, onReject);
    wrapPromise(promise);
    return promise;
  };
}

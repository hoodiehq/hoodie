/*jshint -W079 */
var Promise = exports.Promise = (function() {
  var PromiseClass;
  if (typeof global.Promise === 'function') {
    PromiseClass = global.Promise;
  } else {
    PromiseClass = require('bluebird');
  }
  if (! PromiseClass.prototype.done) {
    PromiseClass.prototype.done = function done(callback) {
      this.then(callback);
      return this;
    };
  }
  if (! PromiseClass.prototype.fail) {
    PromiseClass.prototype.fail = function fail(callback) {
      this.then(null, callback);
      return this;
    };
  }
  if (! PromiseClass.prototype.always) {
    PromiseClass.prototype.always = function always(callback) {
      this.then(callback, callback);
      return this;
    };
  }
  if (! PromiseClass.prototype.progress) {
    PromiseClass.prototype.progress = function progress(callback) {
      if (this._progressCallbacks) {
        this._progressCallbacks.push(callback);
      }
      return this;
    };
  }
  return PromiseClass;
})();

module.exports = function Defer() {
  var defer, resolve, reject, promise;

  promise = new Promise(function (resolveCallback, rejectCallback) {
    resolve = function() {
      defer.notify = noop;
      resolveCallback.apply(null, arguments);
    };
    reject = function() {
      defer.notify = noop;
      rejectCallback.apply(null, arguments);
    };
  });

  promise._progressCallbacks = [];
  function notify() {
    var args = Array.prototype.slice.call(arguments);
    promise._progressCallbacks.forEach(function(callback) {
      callback.apply(null, args);
    });
  }
  function noop () {}

  defer = {
    resolve: resolve,
    reject: reject,
    promise: promise,
    notify: notify
  };

  return defer;
};

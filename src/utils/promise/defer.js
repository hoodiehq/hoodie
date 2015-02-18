/*jshint -W079 */
var Promise = require('./promise');

module.exports = function Defer() {
  var defer = {};
  defer.promise = new Promise(function (resolveCallback, rejectCallback) {
    defer.resolve = function resolve(what) {
      defer.notify = function noop () {};
      resolveCallback(what);
    };
    defer.reject = function reject(what) {
      defer.notify = function noop () {};
      rejectCallback(what);
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

function noop(){}
function wrapPromise (promise) {
  if (promise._isHoodiePromise) {
    return promise;
  }
  promise._isHoodiePromise = true;

  promise.done = function done(callback) {
    this.then(callback).catch(noop);
    return this;
  };
  promise.fail = function fail(callback) {
    this.then(null, callback).catch(noop);
    return this;
  };
  promise.always = function always(callback) {
    this.then(callback, callback).catch(noop);
    return this;
  };
  promise.progress = function progress(callback) {
    if (this._progressCallbacks) {
      this._progressCallbacks.push(callback);
    }
    return this;
  };
  promise.then = function (onResolve, onReject) {
    promise = Promise.prototype.then.call(this,
      passProgressCallbacks(this, onResolve),
      passProgressCallbacks(this, onReject));
    wrapPromise(promise);
    promise._progressCallbacks = this._progressCallbacks;
    return promise;
  };

  promise.catch = function catch_(error) {
    promise = Promise.prototype.catch.call(this, error);
    wrapPromise(promise);
    return promise;
  };

  function passProgressCallbacks(promise, callback) {
    if (! callback) {
      return null;
    }

    return function() {
      var newPromise = callback.apply(promise, arguments);
      if (newPromise && newPromise._progressCallbacks && promise._progressCallbacks) {
        newPromise._progressCallbacks = newPromise._progressCallbacks.concat(promise._progressCallbacks);
      }
      return newPromise;
    };
  }
}

var localStore = require('./localstore');

var exports = module.exports;

//
exports.start = function(state) {
  state.bootstrapping = true;
  state.hoodie.store.trigger('bootstrap:start');
};

//
exports.end = function(state) {
  var methodCall, method, args, defer;

  state.bootstrapping = false;
  while (state.queue.length > 0) {
    methodCall = state.queue.shift();
    method = methodCall[0];
    args = methodCall[1];
    defer = methodCall[2];
    localStore[method]
      .bind(localStore)
      .apply(localStore, args)
      .then(defer.resolve, defer.reject);
  }

  state.hoodie.store.trigger('bootstrap:end');
};

//
exports.abort = function(state, error) {
  var methodCall, defer;

  state.bootstrapping = false;
  while (state.queue.length > 0) {
    methodCall = state.queue.shift();
    defer = methodCall[2];
    defer.reject(error);
  }

  state.hoodie.store.trigger('bootstrap:error', error);
};

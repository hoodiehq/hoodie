var extend = require('extend');
var helpers = require('./helpers');
var utils = require('../../utils');
var getDefer = utils.promise.defer;

var exports = module.exports;

// start
// -------

// start a new task. If the user has no account yet, hoodie tries to sign up
// for an anonymous account in the background. If that fails, the returned
// promise will be rejected.
//
exports.start = function(state, type, properties) {
  var defer;

  if (state.hoodie.account.hasAccount()) {
    return state.hoodie.store.add('$' + type, properties)
      .then(helpers.handleNewTask.bind(null, state));
  }

  defer = getDefer();
  state.hoodie.account.anonymousSignUp().then(function() {
    return exports.start(state, type, properties)
    .progress(defer.notify);
  }).done(defer.resolve).fail(defer.reject);

  return defer.promise;
};


// abort
// -------

// abort a running task
//
exports.abort = function(state, type, id) {
  return state.hoodie.store.update('$' + type, id, {
    abortedAt: helpers.now(state)
  }).then(helpers.handleAbortedTaskObject.bind(null, state));
};


// restart
// ---------

// first, we try to abort a running task. If that succeeds, we start
// a new one with the same properties as the original
//
exports.restart = function(state, type, id, update) {
  var start = function(object) {
    extend(object, update);
    delete object.$error;
    delete object.$processedAt;
    delete object.abortedAt;
    return exports.start(state, object.type.substr(1), object);
  };
  return exports.abort(state, type, id).then(start);
};

// abortAll
// -----------

//
exports.abortAll = function(state, type) {
  return helpers.findAll(state, type)
    .then(helpers.abortTaskObjects.bind(null, state));
};

// restartAll
// -----------

//
exports.restartAll = function(state, type, update) {
  if (typeof type === 'object') {
    update = type;
  }

  return helpers.findAll(state, type).then(function(taskObjects) {
    helpers.restartTaskObjects(state, taskObjects, update);
  });
};

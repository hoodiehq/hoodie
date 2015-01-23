var lib = require('../../lib');
var HoodieError = lib.error.error;

var utils = require('../../utils');
var getDefer = utils.promise.defer;
var extend = require('extend');

var exports = module.exports;

// Private
// -------

//
exports.handleNewTask = function(state, object) {
  var defer = getDefer();
  var taskStore = state.hoodie.store(object.type, object.id);

  taskStore.on('sync', function(object) {
    // remove "$" from type
    object.type = object.type.substr(1);

    defer.notify(object);
  });

  taskStore.on('remove', function(object) {

    // remove "$" from type
    object.type = object.type.substr(1);

    // task finished by worker.
    if (object.$processedAt) {
      return defer.resolve(object);
    }

    // manually removed / aborted.
    defer.reject(new HoodieError({
      message: 'Task has been aborted',
      task: object
    }));
  });
  taskStore.on('update', function(object) {
    var error = object.$error;

    if (! object.$error) {
      return;
    }

    // remove "$" from type
    object.type = object.type.substr(1);

    delete object.$error;
    error.object = object;
    error.message = error.message || 'Something went wrong';

    defer.reject(new HoodieError(error));

    // remove errored task
    state.hoodie.store.remove('$' + object.type, object.id);
  });

  return defer.promise;
};

//
exports.handleAbortedTaskObject = function(state, taskObject) {
  var defer;
  var type = taskObject.type; // no need to prefix with $, it's already prefixed.
  var id = taskObject.id;
  var removePromise = state.hoodie.store.remove(type, id);

  if (!taskObject._rev) {
    // task has not yet been synced.
    return removePromise;
  }

  defer = getDefer();
  state.hoodie.once('store:sync:' + type + ':' + id, defer.resolve);
  removePromise.fail(defer.reject);

  return defer.promise;
};

//
exports.handleStoreChange = function(state, eventName, object, options) {
  if (object.type[0] !== '$') {
    return;
  }

  object.type = object.type.substr(1);
  exports.triggerEvents(state, eventName, object, options);
};

//
exports.findAll = function(state, type) {
  var startsWith = '$';
  var filter;
  if (type) {
    startsWith += type;
  }

  filter = function(object) {
    return object.type.indexOf(startsWith) === 0;
  };
  return state.hoodie.store.findAll(filter);
};

//
exports.abortTaskObjects = function(state, taskObjects) {
  return taskObjects.map(function(taskObject) {
    return state.hoodie.task.abort(taskObject.type.substr(1), taskObject.id);
  });
};

//
exports.restartTaskObjects = function(state, taskObjects, update) {
  return taskObjects.map(function(taskObject) {
    return state.hoodie.task.restart(taskObject.type.substr(1), taskObject.id, update);
  });
};

// this is where all the task events get triggered,
// like add:message, change:message:abc4567, remove, etc.
exports.triggerEvents = function(state, eventName, task, options) {
  var error;

  // "new" tasks are trigger as "start" events
  if (eventName === 'add') {
    eventName = 'start';
  }

  if (eventName === 'remove' && task.abortedAt) {
    eventName = 'abort';
  }

  if (eventName === 'remove' && task.$processedAt && !task.$error) {
    eventName = 'success';
  }

  if (eventName === 'update' && task.$error) {
    eventName = 'error';
    error = task.$error;
    delete task.$error;

    state.events.trigger('error', error, task, options);
    state.events.trigger(task.type + ':error', error, task, options);
    state.events.trigger(task.type + ':' + task.id + ':error', error, task, options);

    options = extend({}, options, {
      error: error
    });

    state.events.trigger('change', 'error', task, options);
    state.events.trigger(task.type + ':change', 'error', task, options);
    state.events.trigger(task.type + ':' + task.id + ':change', 'error', task, options);

    return;
  }

  // ignore all the other events
  if (eventName !== 'start' && eventName !== 'abort' && eventName !== 'success') {
    return;
  }

  state.events.trigger(eventName, task, options);
  state.events.trigger(task.type + ':' + eventName, task, options);

  if (eventName !== 'start') {
    state.events.trigger(task.type + ':' + task.id + ':' + eventName, task, options);
  }

  state.events.trigger('change', eventName, task, options);
  state.events.trigger(task.type + ':change', eventName, task, options);

  if (eventName !== 'start') {
    state.events.trigger(task.type + ':' + task.id + ':change', eventName, task, options);
  }
};

//
exports.now = function() {
  return JSON.stringify(new Date()).replace(/['"]/g, '');
};

/* exported hoodieTask */
/* global hoodieEvents */

// Tasks
// ============

// This class defines the hoodie.task API.
//
// The returned API provides the following methods:
//
// * start
// * cancel
// * restart
// * remove
// * on
// * unbind
//
// At the same time, the returned API can be called as function returning a
// store scoped by the passed type, for example
//
//     var emailTasks = hoodie.task('email');
//     emailTasks.start( properties );
//     emailTasks.cancel('id123');
//

function hoodieTask(hoodie) {

  // public API
  var api = {};

  // add events API
  hoodieEvents(hoodie, { context: api, namespace: 'task' });

  //
  api.start = function(type, properties) {
    return hoodie.store.add('$'+type, properties).then(handleNewTask);
  };

  //
  api.cancel = function(type, id) {

  };

  //
  api.restart = function() {

  };

  //
  api.remove = function() {

  };

  //
  api.on = function() {

  };

  //
  api.unbind = function() {

  };

  //
  // subscribe to store events
  // we subscribe to all store changes, pipe through the task ones,
  // making a few changes along the way.
  //
  function subscribeToStoreEvents() {

    // account events
    hoodie.on('store:change', handleStoreChange);
  }

  // allow to run this only once from outside (during Hoodie initialization)
  api.subscribeToStoreEvents = function() {
    subscribeToStoreEvents();
    delete api.subscribeToStoreEvents;
  };


  // Private
  // -------

  //
  function handleNewTask(object) {
    var defer = hoodie.defer();
    var taskStore = hoodie.store(object.type, object.id);

    taskStore.on('remove', function(object) {

      // remove "$" from type
      object.type = object.type.substr(1);

      // task finished by worker.
      if(object.finishedAt) {
        return defer.resolve(object);
      }

      // manually removed / cancelled.
      defer.reject(object);
    });
    taskStore.on('error', function(error, object) {

      // remove "$" from type
      object.type = object.type.substr(1);

      defer.reject(error, object);
    });

    return defer.promise();
  }

  //
  function handleStoreChange(eventName, object, options) {
    if (object.type[0] !== '$') {
      return;
    }

    object.type = object.type.substr(1);
    triggerEvents(eventName, object, options);
  }

  // this is where all the task events get triggered,
  // like add:message, change:message:abc4567, remove, etc.
  function triggerEvents(eventName, task, options) {
    var error;

    // "new" tasks are trigger as "start" events
    if (eventName === 'new') {
      eventName = 'start';
    }

    if (eventName === 'remove' && task.canceledAt) {
      eventName = 'cancel';
    }

    if (eventName === 'remove' && task.completedAt) {
      eventName = 'success';
    }

    if (eventName === 'update' && task.$error) {
      eventName = 'error';
      error = task.$error;
      delete task.$error;

      api.trigger('error', error, task, options);
      api.trigger('error:' + task.type, error, task, options);
      api.trigger('error:' + task.type + ':' + task.id, error, task, options);

      options = $.extend({}, options, {error: error});
      api.trigger('change', 'error', task, options);
      api.trigger('change:' + task.type, 'error', task, options);
      api.trigger('change:' + task.type + ':' + task.id, 'error', task, options);
      return;
    }

    // ignore all the other events
    if (eventName !== 'start' && eventName !== 'cancel' && eventName !== 'success') {
      return;
    }

    api.trigger(eventName, task, options);
    api.trigger(eventName + ':' + task.type, task, options);

    if (eventName !== 'start') {
      api.trigger(eventName + ':' + task.type + ':' + task.id, task, options);
    }

    api.trigger('change', eventName, task, options);
    api.trigger('change:' + task.type, eventName, task, options);

    if (eventName !== 'start') {
      api.trigger('change:' + task.type + ':' + task.id, eventName, task, options);
    }
  }

  // extend hoodie
  hoodie.task = api;
}

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

  // extend hoodie
  hoodie.task = api;
}

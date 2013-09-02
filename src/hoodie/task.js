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
  api.start = function() {

  };

  //
  api.cancel = function() {

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

  hoodie.task = api;
}

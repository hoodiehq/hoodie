/* exported hoodieTask */

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

function hoodieTask(hoodie, options) {

  // public API
  var api = {};


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

  return api;
}

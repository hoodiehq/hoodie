// Tasks
// ============

// This class defines the hoodie.task API.
//
// The returned API provides the following methods:
//
// * start
// * abort
// * restart
// * remove
// * on
// * one
// * unbind
//
// At the same time, the returned API can be called as function returning a
// task scoped by the passed type, for example
//
//     var emailTasks = hoodie.task('email');
//     emailTasks.start( properties );
//     emailTasks.abort('id123');
//
var lib = require('../../lib');
var utils = require('../../utils');
var api = require('./api');
var helpers = require('./helpers');

//
var exports = module.exports = function(hoodie) {
  // The wrapping is needed as `exports.scopedTask` expects a taskApi
  // which would still be undefined if we'd pass it directly
  // (the function itself serves as the taskApi object)
  var scopedTask;
  var task = function () {
    return scopedTask.apply(null, arguments);
  };
  scopedTask = exports.scopedTask.bind(null, hoodie, task);

  var state = {
    events: utils.events(hoodie, task, 'task'),
    hoodie: hoodie
  };

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      task[method] = api[method].bind(null, state);
    }
  });

  hoodie.task = task;
  hoodie.on('store:change', helpers.handleStoreChange.bind(null, state));
};

// public API
exports.scopedTask = function (hoodie, taskApi, type, id) {
  return lib.task.scoped(hoodie, taskApi, {
    type: type,
    id: id
  });
};

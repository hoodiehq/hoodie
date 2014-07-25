// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var utils = require('../../utils');

var exports = module.exports = function (hoodie, taskApi, options) {
  var api = {};
  var id = options.id;
  var type = options.type;

  // add events
  utils.events(
    hoodie,
    api,
    ['task', type, id].join(':').replace(/:$/,'')
  );

  // scoped by both: type & id
  if (id) {
    ['abort', 'restart'].forEach(function(method) {
      api[method] = exports[method].bind(null, taskApi, type, id);
    });

    return api;
  }

  // scoped by type only
  ['start', 'abort', 'restart', 'abortAll', 'restartAll'].forEach(function(method) {
    api[method] = exports[method].bind(null, taskApi, type);
  });

  return api;
};

exports.start = function start(taskApi, type, properties) {
  return taskApi.start(type, properties);
};

exports.abort = function abort(taskApi, type, id) {
  return taskApi.abort(type, id);
};

exports.restart = function restart(taskApi, type, id, update) {
  return taskApi.restart(type, id, update);
};

exports.abortAll = function abortAll(taskApi, type) {
  return taskApi.abortAll(type);
};

exports.restartAll = function restartAll(taskApi, type, update) {
  return taskApi.restartAll(type, update);
};

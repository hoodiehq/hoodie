var extend = require('extend');
var utils = require('../../../utils');
var getDefer = utils.promise.defer;
var resolveWith = utils.promise.resolveWith;
var resolve = utils.promise.resolve;

var helpers = require('./helpers');

// request
// ---------
var exports = module.exports;

// wrapper for hoodie's request, with some store specific defaults
// and a prefixed path
//
exports.request = function(state, type, path, options) {
  options = options || {};

  if (state.remoteName) {
    path = '/' + (encodeURIComponent(state.remoteName)) + path;
  }

  if (state.baseUrl) {
    path = '' + state.baseUrl + path;
  }

  options.contentType = options.contentType || 'application/json';

  if (type === 'POST' || type === 'PUT') {
    options.dataType = options.dataType || 'json';
    options.processData = options.processData || false;
    options.data = JSON.stringify(options.data);
  }
  return state.hoodie.request(type, path, options);
};


// isKnownObject
// ---------------

// determine between a known and a new object
//
exports.isKnownObject = function(state, object) {
  var key = '' + object.type + '/' + object.id;

  if (state.knownObjects[key] !== undefined) {
    return state.knownObjects[key];
  }
};


// markAsKnownObject
// -------------------

// determine between a known and a new object
//
exports.markAsKnownObject = function(state, object) {
  var key = '' + object.type + '/' + object.id;
  state.knownObjects[key] = 1;
  return state.knownObjects[key];
};


// synchronization
// -----------------

// Connect
// ---------

// start syncing. `remote.bootstrap()` will automatically start
// pulling when `remote.connected` remains true.
//
var connectDefer;
exports.connect = function(state, name) {
  if (state.connected) {
    return connectDefer.promise;
  }
  connectDefer = getDefer();
  if (name) {
    state.remoteName = name;
  }
  state.connected = true;
  state.remote.trigger('connect');
  state.remote.bootstrap().then(function() {
    return state.remote.push();
  }).then(connectDefer.resolve, connectDefer.reject);

  return connectDefer.promise;
};


// Disconnect
// ------------

// stop syncing changes from remote store
//
exports.disconnect = function(state) {
  state.connected = false;
  state.remote.trigger('disconnect'); // TODO: spec that
  if (state.pullRequest) {
    state.pullRequest.abort();
  }

  if (state.pushRequest) {
    state.pushRequest.abort();
  }

  connectDefer = undefined;
  return resolve();
};


// isConnected
// -------------

//
exports.isConnected = function(state) {
  return state.connected;
};


// getSinceNr
// ------------

// returns the sequence number from which to start to find changes in pull
//
exports.getSinceNr = function(state) {
  if (typeof state.since === 'function') {
    return state.since();
  }

  return state.since;
};


// bootstrap
// -----------

// initial pull of data of the remote store. By default, we pull all
// changes since the beginning, but this behavior might be adjusted,
// e.g for a filtered bootstrap.
//
exports.bootstrap = function(state) {
  state.isBootstrapping = true;
  state.remote.trigger('bootstrap:start');
  return state.remote.pull()
    .done(helpers.handleBootstrapSuccess.bind(null, state))
    .fail(helpers.handleBootstrapError.bind(null, state));
};


// pull changes
// --------------

// a.k.a. make a GET request to CouchDB's `_changes` feed.
// We currently make long poll requests, that we manually abort
// and restart each 25 seconds.
//
exports.pull = function(state) {
  state.pullRequest = state.remote.request('GET', helpers.pullUrl(state));

  if (state.remote.isConnected()) {
    global.clearTimeout(state.pullRequestTimeout);
    state.pullRequestTimeout = global.setTimeout(state.restartPullRequest, 25000);
  }

  return state.pullRequest
    .done(helpers.handlePullSuccess.bind(null, state))
    .fail(helpers.handlePullError.bind(null, state));
};


// push changes
// --------------

// Push objects to remote store using the `_bulk_docs` API.
//
exports.push = function(state, objects) {
  var object;
  var objectsForRemote = [];

  if (! $.isArray(objects)) {
    objects = helpers.defaultObjectsToPush(state);
  }

  if (objects.length === 0) {
    return resolveWith([]);
  }

  // don't mess with the originals
  objects = objects.map(function(object) {
    return extend(true, {}, object);
  });

  objectsForRemote = [];
  for (var i = 0; i < objects.length; i++) {

    object = objects[i];
    helpers.addRevisionTo(state, object);
    state.remote.markAsKnownObject(object);
    object = helpers.parseForRemote(state, object);
    objectsForRemote.push(object);

    // store the revision to prevent change events from
    // being triggered for the same object revisions
    state.pushedObjectRevisions[object._rev] = 1;
  }
  state.pushRequest = state.remote.request('POST', '/_bulk_docs', {
    data: {
      docs: objectsForRemote,
      new_edits: false
    }
  });

  state.pushRequest.done(function() {
    for (var i = 0; i < objects.length; i++) {
      delete objects[i]._revisions;
      state.remote.trigger('push', objects[i]);
    }
  });
  return state.pushRequest;
};

// sync changes
// --------------

// push objects, then pull updates.
//
exports.sync = function(state, objects) {
  return state.remote.push(objects).then(state.remote.pull);
};

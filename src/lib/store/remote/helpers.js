var extend = require('extend');
var utils = require('../../../utils');
var generateId = utils.generateId;

//
// Private
// ---------
//
var exports = module.exports;

// valid CouchDB doc attributes starting with an underscore
//
exports.VALID_SPECIAL_ATTRIBUTES = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];


// default objects to push
// --------------------------

// when pushed without passing any objects, the objects returned from
// this method will be passed. It can be overwritten by passing an
// array of objects or a function as `options.objects`
//
exports.defaultObjectsToPush = function(state) {
  if (! state.options || ! state.options.defaultObjectsToPush) {
    return [];
  }
  if (global.$.isArray(state.options.defaultObjectsToPush)) {
    return state.options.defaultObjectsToPush;
  } else {
    return state.options.defaultObjectsToPush();
  }
};

// setSinceNr
// ------------

// sets the sequence number from which to start to find changes in pull.
// If remote store was initialized with since : function(nr) { ... },
// call the function with the seq passed. Otherwise simply set the seq
// number and return it.
//
exports.setSinceNr = function(state, seq) {
  if (typeof state.since === 'function') {
    return state.since(seq);
  }

  state.since = seq;
  return state.since;
};


// Parse for remote
// ------------------

// parse object for remote storage. All properties starting with an
// `underscore` do not get synchronized despite the special properties
// `_id`, `_rev` and `_deleted` (see above)
//
// Also `id` gets replaced with `_id` which consists of type & id
//
exports.parseForRemote = function(state, object) {
  var attr, properties;
  properties = extend({}, object);

  for (attr in properties) {
    if (properties.hasOwnProperty(attr)) {
      if (exports.VALID_SPECIAL_ATTRIBUTES.indexOf(attr) !== -1) {
        continue;
      }
      if (!/^_/.test(attr)) {
        continue;
      }
      delete properties[attr];
    }
  }

  // prepare CouchDB id
  properties._id = '' + properties.type + '/' + properties.id;
  if (state.prefix) {
    properties._id = '' + state.prefix + properties._id;
  }
  delete properties.id;
  return properties;
};

// ### parseFromRemote

// normalize objects coming from remote
//
// renames `_id` attribute to `id` and removes the type from the id,
// e.g. `type/123` -> `123`
//
exports.parseFromRemote = function(state, object) {
  var id, matches;

  // handle id and type
  id = object._id || object.id;
  delete object._id;

  if (state.prefix) {
    id = id.replace(state.remotePrefixPattern, '');
  }

  // turn doc/123 into type = doc & id = 123
  // NOTE: we don't use a simple id.split(/\//) here,
  // as in some cases IDs might contain '/', too
  //
  matches = id.match(/([^\/]+)\/(.*)/);
  object.type = matches[1], object.id = matches[2];

  return object;
};

exports.parseAllFromRemote = function(state, objects) {
  return objects.map(exports.parseFromRemote.bind(null, state));
};


// ### _addRevisionTo

// extends passed object with a _rev property
//
exports.addRevisionTo = function(state, attributes) {
  var currentRevId, currentRevNr, newRevisionId, revParts;
  if (attributes._rev) {
    revParts = attributes._rev.split(/-/);
    currentRevNr = revParts[0];
    currentRevId = revParts[1];
  }
  currentRevNr = parseInt(currentRevNr, 10) || 0;
  newRevisionId = exports.generateNewRevisionId(state);

  // local changes are not meant to be replicated outside of the
  // users database, therefore the `-local` suffix.
  if (attributes._$local) {
    newRevisionId += '-local';
  }

  attributes._rev = '' + (currentRevNr + 1) + '-' + newRevisionId;
  attributes._revisions = {
    start: 1,
    ids: [newRevisionId]
  };

  if (currentRevId) {
    attributes._revisions.start += currentRevNr;
    return attributes._revisions.ids.push(currentRevId);
  }
};


// ### generate new revision id

//
exports.generateNewRevisionId = function() {
  return generateId(9);
};


// ### map docs from findAll

//
exports.mapDocsFromFindAll = function(state, response) {
  return response.rows.map(function(row) {
    return row.doc;
  });
};


// ### pull url

// Depending on whether remote is connected (= pulling changes continuously)
// return a longpoll URL or not. If it is a beginning bootstrap request, do
// not return a longpoll URL, as we want it to finish right away, even if there
// are no changes on remote.
//
exports.pullUrl = function(state) {
  var since = state.remote.getSinceNr();
  if (state.remote.isConnected() && !state.isBootstrapping) {
    return '/_changes?include_docs=true&since=' + since + '&heartbeat=10000&feed=longpoll';
  } else {
    return '/_changes?include_docs=true&since=' + since;
  }
};


// ### restart pull request

// request gets restarted automatically
// when aborted (see handlePullError)
exports.restartPullRequest = function(state) {
  if (state.pullRequest) {
    state.pullRequest.abort();
  }
};


// ### pull success handler

// request gets restarted automatically
// when aborted (see handlePullError)
//
exports.handlePullSuccess = function(state, response) {
  exports.setSinceNr(state, response.last_seq);
  exports.handlePullResults(state, response.results);
  if (state.remote.isConnected()) {
    state.remote.pull().catch(function(){});
  }
};


// ### pull error handler

// when there is a change, trigger event,
// then check for another change
//
exports.handlePullError = function(state, xhr, error) {
  if (!state.remote.isConnected()) {
    return;
  }

  switch (xhr.status) {
    // Session is invalid. User is still login, but needs to reauthenticate
    // before sync can be continued
  case 401:
    state.remote.trigger('error:unauthenticated', error);
    return state.remote.disconnect().catch(function(){});

    // the 404 comes, when the requested DB has been removed
    // or does not exist yet.
    //
    // BUT: it might also happen that the background workers did
    //      not create a pending database yet. Therefore,
    //      we try it again in 3 seconds
    //
    // TODO: review / rethink that.
    //
  case 404:
    return global.setTimeout(state.remote.pullSilently, 3000);

  case 500:
    //
    // Please server, don't give us these. At least not persistently
    //
    state.remote.trigger('error:server', error);
    global.setTimeout(state.remote.pullSilently, 3000);
    return state.hoodie.checkConnection().catch(function(){});
  default:
    // usually a 0, which stands for timeout or server not reachable.
    if (xhr.statusText === 'abort') {
      // manual abort after 25sec. restart pulling changes directly when connected
      return state.remote.pull().catch(function(){});
    } else {

      // oops. This might be caused by an unreachable server.
      // Or the server cancelled it for what ever reason, e.g.
      // heroku kills the request after ~30s.
      // we'll try again after a 3s timeout
      //
      global.setTimeout(state.remote.pullSilently, 3000);
      return state.hoodie.checkConnection().catch(function(){});
    }
  }
};


// ### handle initial bootstrapping from remote
//
exports.handleBootstrapSuccess = function(state) {
  state.isBootstrapping = false;
  state.remote.trigger('bootstrap:end');
};

// ### handle error of initial bootstrapping from remote
//
exports.handleBootstrapError = function(state, error) {
  state.isBootstrapping = false;
  state.remote.trigger('bootstrap:error', error);
};

// ### handle changes from remote
//
exports.handlePullResults = function(state, changes) {
  var doc, event, object;

  var remote = state.remote;

  for (var i = 0; i < changes.length; i++) {
    doc = changes[i].doc;

    if (state.prefix && doc._id.indexOf(state.prefix) !== 0) {
      continue;
    }

    if (state.pushedObjectRevisions[doc._rev]) {
      continue;
    }

    object = exports.parseFromRemote(state, doc);

    if (object._deleted) {
      if (!state.remote.isKnownObject(object)) {
        continue;
      }
      event = 'remove';
      remote.isKnownObject(object);
    } else {
      if (remote.isKnownObject(object)) {
        event = 'update';
      } else {
        event = 'add';
        remote.markAsKnownObject(object);
      }
    }

    remote.trigger(event, object);
    remote.trigger(object.type + ':' + event, object);
    remote.trigger(object.type + ':' + object.id + ':' + event, object);
    remote.trigger('change', event, object);
    remote.trigger(object.type + ':change', event, object);
    remote.trigger(object.type + ':' + object.id + ':change', event, object);
  }

  // reset the hash for pushed object revision after
  // every response from the longpoll GET /_changes
  state.pushedObjectRevisions = {};
};


// avoid "Unhandled promise rejection" errors
exports.pullSilently = function (state) {
  state.remote.pull().catch(function(){});
};

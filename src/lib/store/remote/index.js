var hoodieStoreApi = require('../api');
var remoteStore = require('./remotestore');
var api = require('./api');

// Remote
// ========

// Connection to a remote Couch Database.
//
// store API
// ----------------
//
// object loading / updating / deleting
//
// * find(type, id)
// * findAll(type )
// * add(type, object)
// * save(type, id, object)
// * update(type, id, new_properties )
// * updateAll( type, new_properties)
// * remove(type, id)
// * removeAll(type)
//
// custom requests
//
// * request(view, params)
// * get(view, params)
// * post(view, params)
//
// synchronization
//
// * connect()
// * disconnect()
// * pull()
// * push()
// * sync()
//
// event binding
//
// * on(event, callback)
//

module.exports = function(hoodie, options) {
  var internals = {
    connected: false,
    prefix: '',
    baseUrl: undefined
  };

  var state = {
    get baseUrl() {
      return internals.baseUrl;
    },
    set baseUrl(input) {
      internals.baseUrl = input;
      remote.baseUrl = input;
    },
    // sync
    // if set to true, updates will be continuously pulled
    // and pushed. Alternatively, `sync` can be set to
    // `pull: true` or `push: true`.
    //
    get connected() {
      return internals.connected;
    },
    set connected(input) {
      internals.connected = input;
      remote.connected = input;
    },
    // prefix
    // prefix for docs in a CouchDB database, e.g. all docs
    // in public user stores are prefixed by '$public/'
    //
    get prefix() {
      return internals.prefix;
    },
    set prefix(input) {
      internals.prefix = input;
      remote.prefix = input;
    },

    // name

    // the name of the Remote is the name of the
    // CouchDB database and is also used to prefix
    // triggered events
    //
    remoteName: null,
    remotePrefixPattern: new RegExp('^'),
    // TODO: spec that!
    since: options.since || 0,
    isBootstrapping: false,
    pullRequest: undefined,
    pullRequestTimeout: undefined,
    pushRequest: undefined,
    pushedObjectRevisions: {},
    // in order to differentiate whether an object from remote should trigger a 'new'
    // or an 'update' event, we store a hash of known objects
    knownObjects: {},
    options: options,
    hoodie: hoodie
  };

  var remote = hoodieStoreApi(hoodie, {
    name: options.name,

    backend: {
      save: remoteStore.save.bind(null, state),
      find: remoteStore.find.bind(null, state),
      findAll: remoteStore.findAll.bind(null, state),
      remove: remoteStore.remove.bind(null, state),
      removeAll: remoteStore.removeAll.bind(null, state)
    }
  });

  // defaults
  // ----------------

  //
  if (options.name !== undefined) {
    state.remoteName = options.name;
  }

  if (options.prefix !== undefined) {
    state.prefix = options.prefix;
    state.remotePrefixPattern = new RegExp('^' + state.prefix);
  }

  if (options.baseUrl !== null) {
    state.baseUrl = options.baseUrl;
  }

  // public API
  Object.keys(api).forEach(function(method) {
    if (typeof api[method] === 'function') {
      remote[method] = api[method].bind(null, state);
    }
  });

  // bootstrap known objects
  //
  if (options.knownObjects) {
    for (var i = 0; i < options.knownObjects.length; i++) {
      remote.markAsKnownObject({
        type: options.knownObjects[i].type,
        id: options.knownObjects[i].id
      });
    }
  }

  // externalize current remote instance
  state.remote = remote;

  return remote;
};

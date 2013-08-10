/* exported hoodieRemote */
/* global hoodieRemoteBase */

// AccountRemote
// ===============

// Connection / Socket to our couch
//
// AccountRemote is using CouchDB's `_changes` feed to
// listen to changes and `_bulk_docs` to push local changes
//
// When hoodie.remote is continuously syncing (default),
// it will continuously  synchronize with local store,
// otherwise sync, pull or push can be called manually
//


function hoodieRemote (hoodie) {

  // inherit from Hoodies Store API
  var remoteBase = hoodieRemoteBase(hoodie, {

    // set name to user's DB name
    name: hoodie.account.db(),

    // we're always connected to our own db
    connected: true,

    // do not prefix files for my own remote
    prefix: ''
  });
  var remote = Object.create(remoteBase);


  // Connect
  // ---------

  // do not start to connect immediately, but authenticate beforehand
  //
  remote.connect = function connect() {
    return hoodie.account.authenticate().pipe(doConnect);
  };


  // disconnect
  // ------------

  //
  remote.disconnect = function disconnect() {
    hoodie.unbind('store:idle', remote.push);
    return remoteBase.disconnect.apply(remote, arguments);
  };


  // get and set since nr
  // ----------------------

  // we store the last since number from the current user's store
  // in his config
  //
  remote.getSinceNr = function getSinceNr() {
    return hoodie.config.get('_remote.since') || 0;
  };

  remote.setSinceNr = function setSinceNr(since) {
    return hoodie.config.set('_remote.since', since);
  };


  // push
  // ------

  // if no objects passed to be pushed, we default to
  // changed objects in user's local store
  //
  remote.push = function push(objects) {
    if (!remote.isConnected()) {
      var error = new window.ConnectionError('Not connected: could not push local changes to remote');
      return hoodie.rejectWith(error);
    }

    if (!$.isArray(objects)) {
      objects = hoodie.store.changedObjects();
    }

    var promise = remoteBase.push.apply(remote, [objects]);
    promise.fail(hoodie.checkConnection);

    return promise;
  };


  // Events
  // --------
  //
  // namespaced alias for `hoodie.on`
  //
  remote.on = function on(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, '$1remote:$2');
    return hoodie.on(event, cb);
  };

  remote.one = function one(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, '$1remote:$2');
    return hoodie.one(event, cb);
  };


  //
  // namespaced alias for `hoodie.trigger`
  //
  remote.trigger = function trigger() {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return (_ref = hoodie).trigger.apply(_ref, ['remote:' + event].concat(Array.prototype.slice.call(parameters)));
  };


  // Private
  // ---------

  // to determine wether to trigger an `add` or `update`
  // event, the known objects from the user get loaded
  // from local store initially.
  //
  function loadListOfKnownObjectsFromLocalStore() {
    var id, key, type, _i, _len, _ref, _ref1;
    _ref = hoodie.store.index();

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      _ref1 = key.split(/\//),
      type = _ref1[0],
      id = _ref1[1];

      remote.markAsKnownObject({
        type: type,
        id: id
      });
    }
  }
  // allow to run this once from outside
  remote.loadListOfKnownObjectsFromLocalStore = function() {
    loadListOfKnownObjectsFromLocalStore();
    delete remote.loadListOfKnownObjectsFromLocalStore;
  };

  //
  function doConnect() {
    remote.connected = true;
    hoodie.on('store:idle', remote.push);
    return remote.sync();
  }

  //
  function handleSignIn() {
    remote.name = hoodie.account.db();
    return doConnect();
  }

  //
  // subscribe to events coming from account
  //
  function subscribeToOutsideEvents() {

    hoodie.on('reconnected', remote.connect);

    // account events
    hoodie.on('account:signin', handleSignIn);
    hoodie.on('account:reauthenticated', doConnect);
    hoodie.on('account:signout', remote.disconnect);
  }

  // allow to run this once from outside
  remote.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete remote.subscribeToOutsideEvents;
  };




  //
  // expose remote API
  //
  hoodie.remote = remote;
}

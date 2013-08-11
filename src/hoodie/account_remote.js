/* exported hoodieRemote */
/* global hoodieRemoteStore */

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
  var remote = hoodieRemoteStore(hoodie, {

    // set name to user's DB name
    name: hoodie.account.db(),

    // we're always connected to our own db
    connected: true,

    // do not prefix files for my own remote
    prefix: '',

    //
    since: hoodie.config.get('_remote.since') || 0,

    //
    defaultObjectsToPush: hoodie.store.changedObjects,

    //
    knownObjects: hoodie.store.index().map( function(key) {
      var typeAndId = key.split(/\//);
      return { tyep: typeAndId[0], id: typeAndId[1]};
    })
  });


  // Private
  // ---------

  // to determine wether to trigger an `add` or `update`
  // event, the known objects from the user get loaded
  // from local store initially.
  //
  function loadListOfKnownObjectsFromLocalStore() {
    var _i, _len, keys, typeAndId;
    keys = hoodie.store.index();

    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      typeAndId = keys[_i].split(/\//),

      remote.markAsKnownObject({
        type: typeAndId[0],
        id: typeAndId[1]
      });
    }
  }

  // allow to run this once from outside
  remote.loadListOfKnownObjectsFromLocalStore = function() {
    loadListOfKnownObjectsFromLocalStore();
    delete remote.loadListOfKnownObjectsFromLocalStore;
  };

  //
  // subscribe to events coming from account
  //
  function subscribeToEvents() {

    remote.on('disconnect', function() {
      hoodie.unbind('store:idle', remote.push);
    });
    remote.on('connect', function() {
      hoodie.on('store:idle', remote.push);
    });
    remote.on('pull', function(since) {
      hoodie.config.set('_remote.since', since);
    });

    hoodie.on('reconnected', remote.connect);

    // account events
    hoodie.on('account:signin', function() {
      remote.name = hoodie.account.db();
      return remote.connect();
    });
    hoodie.on('account:reauthenticated', remote.connect);
    hoodie.on('account:signout', remote.disconnect);
  }

  // allow to run this once from outside
  remote.subscribeToEvents = function() {
    subscribeToEvents();
    delete remote.subscribeToEvents;
  };

  //
  // expose remote API
  //
  hoodie.remote = remote;
}

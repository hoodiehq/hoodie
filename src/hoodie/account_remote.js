/* exported hoodieRemote */

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
  var remote = hoodie.open(hoodie.account.db(), {

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
      return { type: typeAndId[0], id: typeAndId[1]};
    })
  });


  // Private
  // ---------

  //
  // subscribe to events coming from account
  //
  function subscribeToEvents() {

    hoodie.on('remote:connect', function() {
      hoodie.on('store:idle', remote.push);
    });
    hoodie.on('remote:disconnect', function() {
      hoodie.unbind('store:idle', remote.push);
    });
    hoodie.on('remote:pull', function(since) {
      hoodie.config.set('_remote.since', since);
    });

    hoodie.on('reconnected', remote.connect);

    // account events
    hoodie.on('account:signin', function() {
      remote.name = hoodie.account.db();
      remote.connect();
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

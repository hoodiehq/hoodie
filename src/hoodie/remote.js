var utils = require('../utils');
var config = utils.config;
var rejectWith = utils.promise.rejectWith;

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
var exports = module.exports = function(hoodie) {
  // inherit from Hoodies Store API
  var remote = hoodie.open(hoodie.account.db(), {
    // we're always connected to our own db
    connected: true,
    // do not prefix files for my own remote
    prefix: '',
    //
    since: exports.sinceNrCallback,
    //
    defaultObjectsToPush: hoodie.store.changedObjects,
    //
    knownObjects: hoodie.store.index().map(function(key) {
      var typeAndId = key.split(/\//);
      return {
        type: typeAndId[0],
        id: typeAndId[1]
      };
    })
  });

  remote.connect = exports.connect.bind(null, hoodie, remote.connect);
  remote.trigger = exports.trigger.bind(null, hoodie);
  remote.on = exports.on.bind(null, hoodie);
  remote.unbind = exports.unbind.bind(null, hoodie);

  //
  // subscribe to events coming from outside
  //
  hoodie.on('remote:connect', function() {
    hoodie.on('store:idle', remote.push);
  });

  hoodie.on('remote:disconnect', function() {
    hoodie.unbind('store:idle', remote.push);
  });

  hoodie.on('disconnected', remote.disconnect);
  hoodie.on('reconnected', remote.connect);

  // account events
  hoodie.on('account:signup', remote.connect);
  hoodie.on('account:signup:anonymous', remote.connect);
  hoodie.on('account:signin', remote.connect);
  hoodie.on('account:signin:anonymous', remote.connect);
  hoodie.on('account:changeusername', remote.connect);

  hoodie.on('account:reauthenticated', remote.connect);
  hoodie.on('account:signout', remote.disconnect);

  //
  // expose remote API
  //
  hoodie.remote = remote;
};

// Connect
// ---------

// we slightly extend the original remote.connect method
// provided by `hoodieRemoteStore`, to check if the user
// has an account beforehand. We also hardcode the right
// name for remote (current user's database name)
//
exports.connect = function(hoodie, originalConnectMethod) {
  if (!hoodie.account.hasAccount()) {
    return rejectWith('User has no database to connect to');
  }
  return originalConnectMethod(hoodie.account.db());
};

// trigger
// ---------

// proxies to hoodie.trigger
exports.trigger = function(hoodie) {
  // shift off state
  var parameters = Array.prototype.slice.call(arguments,1);
  // eventName
  parameters[0] = 'remote:' + parameters[0];
  return hoodie.trigger.apply(hoodie, parameters);
};

// on
// ---------

// proxies to hoodie.on
exports.on = function(hoodie, eventName, data) {
  eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+'remote:$2');
  return hoodie.on(eventName, data);
};

// unbind
// ---------

// proxies to hoodie.unbind
exports.unbind = function(hoodie, eventName, callback) {
  eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+'remote:$2');
  return hoodie.unbind(eventName, callback);
};

// Private
// ---------

// getter / setter for since number
//
exports.sinceNrCallback = function(sinceNr) {
  if (sinceNr) {
    return config.set('_remote.since', sinceNr);
  }

  return config.get('_remote.since') || 0;
};

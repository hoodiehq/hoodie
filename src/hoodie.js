// Hoodie Core
// -------------
//
// the door to world domination (apps)
//

var hoodieAccount = require('./hoodie/account');
var hoodieAccountRemote = require('./hoodie/remote');
var hoodieConfig = require('./hoodie/config');
var hoodieConnection = require('./hoodie/connection');
var hoodieId = require('./hoodie/id');
var hoodieLocalStore = require('./hoodie/store');
var hoodieDispose = require('./hoodie/dispose');
var hoodieTask = require('./hoodie/task');
var hoodieOpen = require('./hoodie/open');

var hoodieEvents = require('./lib/events');

var hoodieRequest = require('./utils/request');
var hoodiePromises = require('./utils/promises');

// Constructor
// -------------

// When initializing a hoodie instance, an optional URL
// can be passed. That's the URL of the hoodie backend.
// If no URL passed it defaults to the current domain.
//
//     // init a new hoodie instance
//     hoodie = new Hoodie
//
function Hoodie(baseUrl) {
  var hoodie = this;

  // enforce initialization with `new`
  if (!(hoodie instanceof Hoodie)) {
    throw new Error('usage: new Hoodie(url);');
  }

  if (baseUrl) {
    // remove trailing slashes
    hoodie.baseUrl = baseUrl.replace(/\/+$/, '');
  }


  // hoodie.extend
  // ---------------

  // extend hoodie instance:
  //
  //     hoodie.extend(function(hoodie) {} )
  //
  hoodie.extend = function extend(extension) {
    extension(hoodie);
  };


  //
  // Extending hoodie core
  //

  // * hoodie.bind
  // * hoodie.on
  // * hoodie.one
  // * hoodie.trigger
  // * hoodie.unbind
  // * hoodie.off
  hoodie.extend(hoodieEvents);


  // * hoodie.defer
  // * hoodie.isPromise
  // * hoodie.resolve
  // * hoodie.reject
  // * hoodie.resolveWith
  // * hoodie.rejectWith
  hoodie.extend(hoodiePromises);

  // * hoodie.request
  hoodie.extend(hoodieRequest);

  // * hoodie.isOnline
  // * hoodie.checkConnection
  hoodie.extend(hoodieConnection);

  // * hoodie.dispose
  hoodie.extend(hoodieDispose);

  // * hoodie.open
  hoodie.extend(hoodieOpen);

  // * hoodie.store
  hoodie.extend(hoodieLocalStore);

  // workaround, until we ship https://github.com/hoodiehq/hoodie.js/issues/199
  hoodie.store.patchIfNotPersistant();

  // * hoodie.task
  hoodie.extend(hoodieTask);

  // * hoodie.config
  hoodie.extend(hoodieConfig);

  // * hoodie.account
  hoodie.extend(hoodieAccount);

  // * hoodie.remote
  hoodie.extend(hoodieAccountRemote);

  // * hoodie.id
  hoodie.extend(hoodieId);


  //
  // Initializations
  //

  // init config
  hoodie.config.init();

  // init hoodieId
  hoodie.id.init();

  // set username from config (local store)
  hoodie.account.username = hoodie.config.get('_account.username');

  // init hoodie.remote API
  hoodie.remote.init();

  // check for pending password reset
  hoodie.account.checkPasswordReset();

  // hoodie.id
  hoodie.id.subscribeToOutsideEvents();

  // hoodie.config
  hoodie.config.subscribeToOutsideEvents();

  // hoodie.store
  hoodie.store.subscribeToOutsideEvents();
  hoodie.store.bootstrapDirtyObjects();

  // hoodie.remote
  hoodie.remote.subscribeToOutsideEvents();

  // hoodie.task
  hoodie.task.subscribeToOutsideEvents();

  // authenticate
  // we use a closure to not pass the username to connect, as it
  // would set the name of the remote store, which is not the username.
  hoodie.account.authenticate().then(function( /* username */ ) {
    hoodie.remote.connect();
  });

  // check connection when browser goes online / offline
  global.addEventListener('online', hoodie.checkConnection, false);
  global.addEventListener('offline', hoodie.checkConnection, false);

  // start checking connection
  hoodie.checkConnection();

  //
  // loading user extensions
  //
  applyExtensions(hoodie);
}

// Extending hoodie
// ------------------

// You can extend the Hoodie class like so:
//
// Hoodie.extend(funcion(hoodie) { hoodie.myMagic = function() {} })
//
var extensions = [];

Hoodie.extend = function(extension) {
  extensions.push(extension);
};

//
// detect available extensions and attach to Hoodie Object.
//
function applyExtensions(hoodie) {
  for (var i = 0; i < extensions.length; i++) {
    extensions[i](hoodie);
  }
}

module.exports = Hoodie;

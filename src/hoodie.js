// Hoodie Core
// -------------
//
// the door to world domination (apps)
//

var hoodieAccount = require('./hoodie/account');
var hoodieAccountRemote = require('./hoodie/remote');
var hoodieConnection = require('./hoodie/connection');
var hoodieId = require('./hoodie/id');
var hoodieLocalStore = require('./hoodie/store');
var hoodieTask = require('./hoodie/task');
var hoodieOpen = require('./hoodie/open');
var hoodieRequest = require('./hoodie/request');
var hoodieEvents = require('./lib/events');

// for plugins
var lib = require('./lib');
var utils = require('./utils');

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

  // remove trailing slashes
  hoodie.baseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : '';


  // hoodie.extend
  // ---------------

  // extend hoodie instance:
  //
  //     hoodie.extend(function(hoodie) {} )
  //
  hoodie.extend = function extend(extension) {
    extension(hoodie, lib, utils);
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

  // * hoodie.isOnline
  // * hoodie.checkConnection
  hoodie.extend(hoodieConnection);

  // * hoodie.open
  hoodie.extend(hoodieOpen);

  // * hoodie.store
  hoodie.extend(hoodieLocalStore);

  // * hoodie.task
  hoodie.extend(hoodieTask);

  // * hoodie.account
  hoodie.extend(hoodieAccount);

  // * hoodie.remote
  hoodie.extend(hoodieAccountRemote);

  // * hoodie.id
  hoodie.extend(hoodieId);

  // * hoodie.request
  hoodie.extend(hoodieRequest);


  //
  // Initializations
  //

  // cleanup config on signout
  hoodie.on('account:cleanup', utils.config.clear);

  // init hoodieId
  hoodie.id.init();

  // set username from config (local store)
  hoodie.account.username = utils.config.get('_account.username');

  // init hoodie.remote API
  hoodie.remote.init();

  // check for pending password reset
  hoodie.account.checkPasswordReset();

  // make sure removed but not yet synced objects get pushed.
  hoodie.store.bootstrapDirtyObjects();

  // subscribe to cross events
  hoodie.account.subscribeToOutsideEvents();
  hoodie.id.subscribeToOutsideEvents();
  hoodie.store.subscribeToOutsideEvents();
  hoodie.remote.subscribeToOutsideEvents();
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
// Hoodie.extend(function(hoodie) { hoodie.myMagic = function() {} })
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
    extensions[i](hoodie, lib, utils);
  }
}

module.exports = Hoodie;

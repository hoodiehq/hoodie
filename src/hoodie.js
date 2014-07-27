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
var Hoodie = module.exports = function (baseUrl) {
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

  utils.events(hoodie);

  //
  // Extending hoodie core
  //

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

  // authenticate
  // we use a closure to not pass the username to connect, as it
  // would set the name of the remote store, which is not the username.
  hoodie.account.authenticate().then(function( /* username */ ) {
    hoodie.remote.connect();
  });

  //
  // loading user extensions
  //
  applyExtensions(hoodie);
};

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


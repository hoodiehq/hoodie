/* exported Hoodie */

// Hoodie Core
// -------------
//
// the door to world domination (apps)
//

// Constructor
// -------------

// When initializing a hoodie instance, an optional URL
// can be passed. That's the URL of the hoodie backend.
// If no URL passed it defaults to the current domain.
//
//     // init a new hoodie instance
//     hoodie = new Hoodie
//
var Hoodie = module.exports = (function() {

  // for plugins
  var lib = require('./lib');
  var utils = require('./utils');

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

    utils.events(hoodie);

    //
    // Extending hoodie core
    //

    // order matters b/c of cross module dependencies
    hoodie.extend(require('./hoodie/id'));
    hoodie.extend(require('./hoodie/open'));
    hoodie.extend(require('./hoodie/request'));
    hoodie.extend(require('./hoodie/connection'));

    hoodie.extend(require('./hoodie/store'));
    hoodie.extend(require('./hoodie/account'));
    hoodie.extend(require('./hoodie/remote'));
    hoodie.extend(require('./hoodie/task'));

    // authenticate
    // we use a closure to not pass the username to connect, as it
    // would set the name of the remote store, which is not the username.
    hoodie.account.authenticate().then(function( /* username */ ) {
      return hoodie.remote.connect();
    }).catch(function() {
      // silent "Unhandled promise rejection" in case of error
    });

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

  //
  // detect available extensions and attach to Hoodie Object.
  //
  function applyExtensions(hoodie) {
    for (var i = 0; i < extensions.length; i++) {
      extensions[i](hoodie, lib, utils);
    }
  }

  Hoodie.extend = function(extension) {
    extensions.push(extension);
  };

  return Hoodie;
})();

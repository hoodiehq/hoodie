// Hoodie
// --------
//
// the door to world domination (apps)
//

(function(window) {

  'use strict';

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
    if (! (hoodie instanceof Hoodie)) {
      throw new Error("usage: new Hoodie(url);");
    }

    hoodie.baseUrl = baseUrl ? // if baseUrl passed
      baseUrl.replace(/\/+$/, '') // remove trailing slash(es)
      : "/_api"; // otherwise default to current domain


    // hoodie.extend
    // ---------------

    // extend hoodie instance:
    //
    //     hoodie.extend(function(hoodie) {} )
    //
    hoodie.extend = function extend(extension) {
      extension(hoodie);
    };

    // * hoodie.bind
    // * hoodie.on
    // * hoodie.one
    // * hoodie.trigger
    // * hoodie.unbind
    // * hoodie.off
    hoodie.extend( hoodieEvents );

    // * hoodie.defer
    // * hoodie.isPromise
    // * hoodie.resolve
    // * hoodie.reject
    // * hoodie.resolveWith
    // * hoodie.rejectWith
    hoodie.extend( hoodiePromises );

    // * hoodie.request
    hoodie.extend( hoodieRequest );

    // * hoodie.isOnline
    // * hoodie.checkConnection
    hoodie.extend( hoodieConnection );

    // * hoodie.uuid
    hoodie.extend( hoodieUUID );

    // * hoodie.dispose
    hoodie.extend( hoodieDispose );

    // * hoodie.open
    hoodie.extend( hoodieOpen );

    // * hoodie.store
    hoodie.extend( hoodieStore );

    // * hoodie.config
    hoodie.extend( hoodieConfig );
    debugger

    // * hoodie.account
    hoodie.extend( hoodieAccount );

    // * hoodie.remote
    hoodie.extend( hoodieRemote );

    // load user extensions
    applyExtensions(hoodie);
  }

  // Extending hoodie
  // ------------------

  // You can either extend the Hoodie class, or a hoodie
  // instance during runtime
  //
  //     Hoodie.extend('magic1', funcion(hoodie) { /* ... */ })
  //     hoodie = new Hoodie
  //     hoodie.extend('magic2', function(hoodie) { /* ... */ })
  //     hoodie.magic1.doSomething()
  //     hoodie.magic2.doSomethingElse()
  //
  // Hoodie can also be extended anonymously
  //
  //      Hoodie.extend(funcion(hoodie) { hoodie.myMagic = function() {} })
  //
  var extensions = [];
  Hoodie.extend = function(extension) {
    extensions.push(extension);
  };

  //
  //
  //
  function applyExtensions(hoodie) {
    for (var i = 0; i < extensions.length; i++) {
      extensions[i](hoodie);
    }
  }

  //
  // expose Hoodie to module loaders. Based on jQuery's implementation.
  //
  if ( typeof module === "object" && module && typeof module.exports === "object" ) {

    // Expose Hoodie as module.exports in loaders that implement the Node
    // module pattern (including browserify). Do not create the global, since
    // the user will be storing it themselves locally, and globals are frowned
    // upon in the Node module world.
    module.exports = Hoodie;


  } else if ( typeof define === "function" && define.amd ) {

    // Register as a named AMD module, since Hoodie can be concatenated with other
    // files that may use define, but not via a proper concatenation script that
    // understands anonymous AMD modules. A named AMD is safest and most robust
    // way to register. Lowercase hoodie is used because AMD module names are
    // derived from file names, and Hoodie is normally delivered in a lowercase
    // file name.
    define( "hoodie", [], function () {
      return Hoodie;
    } );
  } else {

    // set global
    window.Hoodie = Hoodie;
  }

})(window);

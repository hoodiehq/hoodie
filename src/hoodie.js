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


    // Open stores
    // -------------

    // generic method to open a store. Used by
    //
    // * hoodie.remote
    // * hoodie.user("joe")
    // * hoodie.global
    // * ... and more
    //
    //     hoodie.open("some_store_name").findAll()
    //
    function open(storeName, options) {
      options = options || {};

      $extend(options, {
        name: storeName
      });

      return new Hoodie.Remote(hoodie, options);
    }


    // uuid
    // ------

    // helper to generate unique ids.
    function uuid(len) {
      var chars, i, radix;

      // default uuid length to 7
      if (len === undefined) {
        len = 7;
      }

      // uuids consist of numbers and lowercase letters only.
      // We stick to lowercase letters to prevent confusion
      // and to prevent issues with CouchDB, e.g. database
      // names do wonly allow for lowercase letters.
      chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
      radix = chars.length;

      // eehmm, yeah.
      return ((function() {
        var _i, _results = [];

        for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
          var rand = Math.random() * radix;
          _results.push(chars[0] = String(rand).charAt(0));
        }

        return _results;
      })()).join('');
    }

    // Defers / Promises
    // -------------------

    // returns a defer object for custom promise handlings.
    // Promises are heavely used throughout the code of hoodie.
    // We currently borrow jQuery's implementation:
    // http://api.jquery.com/category/deferred-object/
    //
    //     defer = hoodie.defer()
    //     if (good) {
    //       defer.resolve('good.')
    //     } else {
    //       defer.reject('not good.')
    //     }
    //     return defer.promise()
    //

    // returns true if passed object is a promise (but not a deferred),
    // otherwise false.
    function isPromise(object) {
      return !! (object &&
                 typeof object.done === 'function' &&
                 typeof object.resolve !== 'function');
    }

    //
    function resolve() {
      return $defer().resolve().promise();
    }


    //
    function reject() {
      return $defer().reject().promise();
    }


    //
    function resolveWith() {
      var _defer = $defer();
      return _defer.resolve.apply(_defer, arguments).promise();
    }

    //
    function rejectWith() {
      var _defer = $defer();
      return _defer.reject.apply(_defer, arguments).promise();
    }


    // dispose
    // ---------

    // if a hoodie instance is not needed anymore, it can
    // be disposed using this method. A `dispose` event
    // gets triggered that the modules react on.
    function dispose() {
      hoodie.trigger('dispose');
    }


    //
    // hoodie.extend('myMagic', function(hoodie) {} )
    // or
    // hoodie.extend(function(hoodie) {} )
    //
    function extend(extension) {
      extension(hoodie);
    }


    //
    //
    //
    function loadExtensions() {
      for (var i = 0; i < extensions.length; i++) {
        if (extensions[i].name) {
          hoodie[extensions[i].name] = new extensions[i].extension(hoodie);
        } else {
          extensions[i].extension(hoodie);
        }
      }
    }

    // get jQuery methods that Hoodie depends on
    var $defer = window.jQuery.Deferred;
    var $extend = window.jQuery.extend;

    // hoodie core methods
    hoodie.open = open;
    hoodie.uuid = uuid;
    hoodie.dispose = dispose;
    hoodie.extend = extend;

    // promise helpers
    hoodie.defer = $defer;
    hoodie.isPromise = isPromise;
    hoodie.resolve = resolve;
    hoodie.reject = reject;
    hoodie.resolveWith = resolveWith;
    hoodie.rejectWith = rejectWith;



    // * hoodie.bind
    // * hoodie.on
    // * hoodie.one
    // * hoodie.trigger
    // * hoodie.unbind
    // * hoodie.off
    hoodie.extend( hoodieEvents );

    // * hoodie.request
    hoodie.extend( hoodieRequest );

    // * hoodie.isOnline
    // * hoodie.checkConnection
    hoodie.extend( hoodieConnection );

    // load user extensions
    loadExtensions();
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
  Hoodie.extend = function(name, extension) {
    if (extension) {
      extensions.push({
        name: name,
        extension: extension
      });
    } else {
      extensions.push({
        extension: name
      });
    }
  };

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

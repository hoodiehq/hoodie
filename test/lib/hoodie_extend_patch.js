// patch Hoodie.extend so that the extensions
// are accessible via `extension( 'name' )`
// for testing.
(function(window, oldExtend) {
  'use strict';

  var extensions = {};
  Hoodie.extend = function(name, extension) {
    extensions[name] = extension;
    oldExtend(name, extension);
  };

  window.extension = function(name) {
    return extensions[name];
  };
}(window, Hoodie.extend));

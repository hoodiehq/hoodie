/* exported hoodieOpen */
/* global hoodieMemoryStore */

// Open stores
// -------------

function hoodieMemoryOpen(hoodie) {
  var $extend = window.jQuery.extend;

  // generic method to open an in memory store.
  //
  // hoodie.memory.open("some_store_name", {remote: remoteStore}).findAll()
  //
  function open(storeName, options) {
    options = options || {};

    $extend(options, {
      name: storeName
    });

    return hoodieMemoryStore(hoodie, options);
  }

  //
  // Public API
  //
  hoodie.memory = hoodie.memory || {};
  hoodie.memory.open = open;
}

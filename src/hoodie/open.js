/* exported hoodieOpen */

// Open stores
// -------------

function hoodieOpen(hoodie) {

  var $extend = window.jQuery.extend;

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

  //
  // Public API
  //
  hoodie.open = open;
}

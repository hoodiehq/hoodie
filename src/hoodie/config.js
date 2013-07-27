/* exported hoodieConfig */

// Hoodie Config API
// ===================

//
function hoodieConfig(hoodie) {

  var type = '$config';
  var id = 'hoodie';
  var cache = {};

  // set
  // ----------

  // adds a configuration
  //
  function set(key, value) {
    var isSilent, update;

    if (cache[key] === value) {
      return;
    }

    cache[key] = value;

    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';

    return hoodie.store.update(type, id, update, {
      silent: isSilent
    });

  }

  // get
  // ----------

  // receives a configuration
  //
  function get(key) {
    return cache[key];
  }

  // clear
  // ----------

  // clears cache and removes object from store
  //
  function clear() {
    cache = {};
    return hoodie.store.remove(type, id);
  }

  // remove
  // ----------

  // removes a configuration, is a simple alias for config.set(key, undefined)
  //
  function remove(key) {
    return set(key, void 0);
  }

  // load cach
  hoodie.store.find(type, id).done(function(obj) {
    cache = obj;
  });

  // clear on sign out
  hoodie.on('account:signedOut', clear);

  hoodie.config = {
    set : set,
    get : get,
    clear : clear,
    remove : remove
  };
}

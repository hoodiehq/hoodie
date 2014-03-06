// public API
var store = {};

store.setItem = function (name, item) {
  global.localStorage.setItem(name, item);
};

store.getItem = function (name) {
  return global.localStorage.getItem(name);
};

store.removeItem = function (name) {
  return global.localStorage.removeItem(name);
};

store.clear = function () {
  return global.localStorage.clear();
};

store.key = function (nr) {
  return global.localStorage.key(nr);
};

store.length = function () {
  return global.localStorage.length;
};

// more advanced localStorage wrappers to find/save objects
store.setObject = function (key, object) {
  return store.setItem(key, global.JSON.stringify(object));
};

store.getObject = function (key) {
  var item = store.getItem(key);

  if (! item) {
    return null;
  }

  try {
    return global.JSON.parse(item);
  } catch (e) {
    return null;
  }
};

function init() {
  store.isPersistent = isPersistent();
  if (store.isPersistent) {
    return;
  }

  // if store is not persistent, patch all store methods
  store.getItem = function() { return null; };
  store.setItem = function() { return null; };
  store.removeItem = function() { return null; };
  store.key = function() { return null; };
  store.length = function() { return 0; };
  store.isPersistent = function() { return false; };
}


// Is persistant?
// ----------------
//

// returns `true` or `false` depending on whether localStorage is supported or not.
// Beware that some browsers like Safari do not support localStorage in private mode.
//
// inspired by this cappuccino commit
// https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
//

function isPersistent() {
  try {

    // we've to put this in here. I've seen Firefox throwing `Security error: 1000`
    // when cookies have been disabled
    if (!global.localStorage) {
      return false;
    }

    // Just because localStorage exists does not mean it works. In particular it might be disabled
    // as it is when Safari's private browsing mode is active.
    localStorage.setItem('Storage-Test', '1');

    // that should not happen ...
    if (localStorage.getItem('Storage-Test') !== '1') {
      return false;
    }

    // okay, let's clean up if we got here.
    localStorage.removeItem('Storage-Test');
  } catch (_error) {

    // in case of an error, like Safari's Private Mode, return false
    return false;
  }

  // we're good.
  return true;
}

// initialize
init();

module.exports = store;

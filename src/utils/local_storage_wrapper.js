
var exports = module.exports = function() {
  if (!exports.hasLocalStorage()) {
    return exports.createWrapper(exports.localStub, false);
  }

  return exports.createWrapper(global.localStorage, true);
};

exports.createWrapper = function(store, isPersistent) {
  return {
    getItem: store.getItem.bind(store),
    setItem: store.setItem.bind(store),
    removeItem: store.removeItem.bind(store),
    key: store.key.bind(store),
    isPersistent: isPersistent,
    length: function() { return store.length; },
    setObject: exports.setObject.bind(null, store),
    getObject: exports.getObject.bind(null, store)
  };
};

var noop = function() {
  return null;
};

exports.localStub = {
  getItem: noop,
  setItem: noop,
  removeItem: noop,
  key: noop,
  length: 0
};

// more advanced localStorage wrappers to find/save objects
exports.setObject = function (store, key, object) {
  if (typeof object !== 'object') {
    return store.setItem(key, object);
  }

  return store.setItem(key, global.JSON.stringify(object));
};

exports.getObject = function (store, key) {
  var item = store.getItem(key);

  if (!item) {
    return null;
  }

  try {
    return global.JSON.parse(item);
  } catch (e) {
    return item;
  }
};

// Is persistent?
// ----------------
//

// returns `true` or `false` depending on whether localStorage is supported or not.
// Beware that some browsers like Safari do not support localStorage in private mode.
//
// inspired by this cappuccino commit
// https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
//

exports.hasLocalStorage = function() {
  try {

    // we've to put this in here. I've seen Firefox throwing `Security error: 1000`
    // when cookies have been disabled
    if (!global.localStorage) {
      return false;
    }

    // Just because localStorage exists does not mean it works. In particular it might be disabled
    // as it is when Safari's private browsing mode is active.
    global.localStorage.setItem('Storage-Test', '1');

    // that should not happen ...
    if (global.localStorage.getItem('Storage-Test') !== '1') {
      return false;
    }

    // okay, let's clean up if we got here.
    global.localStorage.removeItem('Storage-Test');
  } catch (_error) {

    // in case of an error, like Safari's Private Mode, return false
    return false;
  }

  // we're good.
  return true;
};

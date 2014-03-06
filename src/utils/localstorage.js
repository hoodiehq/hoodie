var extend = require('extend');

module.exports = {

  // Is persistant?
  // ----------------

  // returns `true` or `false` depending on whether localStorage is supported or not.
  // Beware that some browsers like Safari do not support localStorage in private mode.
  //
  // inspired by this cappuccino commit
  // https://github.com/cappuccino/cappuccino/commit/063b05d9643c35b303568a28809e4eb3224f71ec
  //

  isPersistent: function () {
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

  },

  setItem: function (name, item) {

    if (typeof item === 'object') {
      global.localStorage.setItem(name, window.JSON.stringify(item));
    } else {
      global.localStorage.setItem(name, item);
    }

  },

  getItem: function (name) {
    var item = global.localStorage.getItem(name);

    if (typeof item !== 'undefined') {
      try {
        item = global.JSON.parse(item);
      } catch (e) {}
    }

    return item;
  },

  removeItem: function (name) {
    return global.localStorage.removeItem(name);
  },

  clear: function () {
    return global.localStorage.clear();
  },

  key: function (nr) {
    return global.localStorage.key(nr);
  },

  length: function () {
    return global.localStorage.length;
  },

  // more advanced localStorage wrappers to find/save objects
  setObject: function (type, id, object) {
    var key, store;

    key = '' + type + '/' + id;
    store = extend({}, object);

    delete store.type;
    delete store.id;
    return exports.setItem(key, JSON.stringify(store));
  }

};


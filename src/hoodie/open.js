// Open stores
// -------------

var hoodieRemoteStore = require('../lib/store/remote');
var extend = require('extend');

var exports = module.exports = function(hoodie) {
  //
  // Public API
  //
  hoodie.open = exports.open.bind(null, hoodie);
};

// generic method to open a store.
//
//     hoodie.open("some_store_name").findAll()
//
exports.open = function(hoodie, storeName, options) {
  options = options || {};

  extend(options, {
    name: storeName
  });

  return exports.hoodieRemoteStore(hoodie, options);
};

// export for testing
exports.hoodieRemoteStore = hoodieRemoteStore;

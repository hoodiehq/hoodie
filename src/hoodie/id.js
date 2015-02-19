// hoodie.id
// =========

var utils = require('../utils');
var generateId = utils.generateId;
var config = utils.config;

// generates a random id and persists using config
// until the user signs out or deletes local data
var exports = module.exports = function(hoodie) {
  var state = {
    id: config.get('_hoodieId')
  };

  //
  // subscribe to events coming from other modules
  //
  hoodie.on('account:cleanup', exports.unsetId.bind(null, state));
  hoodie.on('account:signin', function(username, hoodieId) {
    exports.setId(state, hoodieId);
  });
  hoodie.on('account:signin:anonymous', exports.setId.bind(null, state));

  //
  // Public API
  //
  hoodie.id = exports.id.bind(null, state);
};


exports.id = function(state) {
  if (!state.id) {
    exports.setId(state, generateId());
  }
  return state.id;
};

exports.setId = function(state, newId) {
  state.id = newId;

  config.set('_hoodieId', state.id);
};

exports.unsetId = function(state) {
  delete state.id;
  config.unset('_hoodieId');
};

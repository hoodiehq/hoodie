// hoodie.id
// =========

var generateId = require('../utils/generate_id');
var config = require('../utils/config');

// generates a random id and persists using config
// until the user signs out or deletes local data
function hoodieId (hoodie) {
  var id;

  function getId() {
    if (! id) {
      setId( generateId() );
    }
    return id;
  }

  function setId(newId) {
    id = newId;
    
    config.set('_hoodieId', newId);
  }

  function unsetId () {
    id = undefined;
    config.unset('_hoodieId');
  }

  //
  // initialize
  //
  function init() {
    id = config.get('_hoodieId');

    // DEPRECATED, remove before 1.0
    if (! id) {
      id = config.get('_account.ownerHash');
    }
  }

  // allow to run init only once from outside
  getId.init = function() {
    init();
    delete getId.init;
  };

  //
  // subscribe to events coming from other modules
  //
  function subscribeToOutsideEvents() {
    hoodie.on('account:cleanup', unsetId);
    hoodie.on('account:signin', function(username, hoodieId) {
      setId(hoodieId);
    });
    hoodie.on('account:signin:anonymous', setId);
  }

  // allow to run this only once from outside
  getId.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete getId.subscribeToOutsideEvents;
  };

  //
  // Public API
  //
  hoodie.id = getId;
}

module.exports = hoodieId;

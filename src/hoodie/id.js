// hoodie.id
// =========

// generates a random id and persists using hoodie.config
// until the user signs out or deletes local data
function hoodieId (hoodie) {
  var id;

  function getId() {
    if (! id) {
      setId( hoodie.generateId() );
    }
    return id;
  }

  function setId(newId) {
    id = newId;
    
    hoodie.config.set('_hoodieId', newId);
  }

  function unsetId () {
    id = undefined;
    hoodie.config.unset('_hoodieId');
  }

  //
  // initialize
  //
  function init() {
    id = hoodie.config.get('_hoodieId');

    // DEPRECATED, remove before 1.0
    if (! id) {
      hoodie.config.get('_account.ownerHash');
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
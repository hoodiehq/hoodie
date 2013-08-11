var Mocks = window.Mocks || {};
Mocks.StoreApi = function (hoodie) {
  var promise = hoodie.defer().promise();

  return {
    save: function() { return promise; },
    add: function() { return promise; },
    findOrAdd: function() { return promise; },
    find: function() { return promise; },
    findAll: function() { return promise; },
    update: function() { return promise; },
    updateAll: function() { return promise; },
    remove: function() { return promise; },
    removeAll: function() { return promise; },

    trigger: function() {},
    on: function() {},
    one: function() {},
    unbind: function() {}
  };
};

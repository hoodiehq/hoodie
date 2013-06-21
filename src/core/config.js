// 
// Central Config API
// 

Hoodie.Config = (function() {

  'use strict';

  function Config(hoodie, options) {
    var self = this;

    options = options || {};

    this.hoodie = hoodie;
    this.clear = this.clear;

    // memory cache
    this.cache = {};

    if (options.type) {
      this.type = options.type;
    }

    if (options.id) {
      this.id = options.id;
    }

    this.hoodie.store.find(this.type, this.id).done(function(obj) {
      self.cache = obj;
      return self.cache;
    });

    this.hoodie.on('account:signedOut', this.clear);
  }

  // used as attribute name in localStorage
  Config.prototype.type = '$config';
  Config.prototype.id = 'hoodie';

  // ## set
  // 
  // adds a configuration
  // 
  Config.prototype.set = function(key, value) {
    var isSilent, update;

    if (this.cache[key] === value) {
      return;
    }

    this.cache[key] = value;

    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';

    return this.hoodie.store.update(this.type, this.id, update, {
      silent: isSilent
    });

  };

  // ## get
  // 
  // receives a configuration
  // 
  Config.prototype.get = function(key) {
    return this.cache[key];
  };

  // ## clear
  // 
  // clears cache and removes object from store
  // 
  Config.prototype.clear = function() {
    this.cache = {};
    return this.hoodie.store.remove(this.type, this.id);
  };

  // ## remove
  // 
  // removes a configuration, is a simple alias for config.set(key, undefined)
  // 
  Config.prototype.remove = function(key) {
    return this.set(key, void 0);
  };

  return Config;

})();

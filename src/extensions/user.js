// User
// ======

// the User Module provides a simple API to find objects from other users public
// stores
//
// For example, the syntax to find all objects from user "Joe" looks like this:
//
//     hoodie.user("Joe").findAll().done( handleObjects )
//

Hoodie.User = (function() {
  function User(hoodie) {
    this.hoodie = hoodie;
    this.api = __bind(this.api, this);
    this.hoodie.store.decoratePromises({
      publish: this._storePublish,
      unpublish: this._storeUnpublish
    });
    return this.api;
  }

  User.prototype.api = function(userHash, options) {
    if (options == null) {
      options = {};
    }
    $.extend(options, {
      prefix: '$public'
    });
    return this.hoodie.open("user/" + userHash + "/public", options);
  };

  User.prototype._storePublish = function(properties) {
    var _this = this;
    return this.pipe(function(objects) {
      var object, _i, _len, _results;
      if (!$.isArray(objects)) {
        objects = [objects];
      }
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        _results.push(_this.hoodie.store.update(object.type, object.id, {
          $public: properties || true
        }));
      }
      return _results;
    });
  };

  User.prototype._storeUnpublish = function() {
    var _this = this;
    return this.pipe(function(objects) {
      var object, _i, _len, _results;
      if (!$.isArray(objects)) {
        objects = [objects];
      }
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        object = objects[_i];
        if (object.$public) {
          _results.push(_this.hoodie.store.update(object.type, object.id, {
            $public: false
          }));
        }
      }
      return _results;
    });
  };

  return User;

})();

Hoodie.extend('user', Hoodie.User);

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

  'use strict';

  function User(hoodie) {
    this.hoodie = hoodie;
    this.api = this.api.bind(this);

    // extend hodie.store promise API
    this.hoodie.store.decoratePromises({
      publish: this._storePublish,
      unpublish: this._storeUnpublish
    });

    // vanilla API syntax:
    // hoodie.user('uuid1234').findAll()
    return this.api;
  }

  // 
  User.prototype.api = function(userHash, options) {
    options = options || {};
    $.extend(options, {
      prefix: '$public'
    });
    return this.hoodie.open("user/" + userHash + "/public", options);
  };


  // hoodie.store decorations
  // --------------------------

  // hoodie.store decorations add custom methods to promises returned
  // by hoodie.store methods like find, add or update. All methods return
  // methods again that will be executed in the scope of the promise, but
  // with access to the current hoodie instance

  // ### publish

  // publish an object. If an array of properties passed, publish only these
  // attributes and hide the remaining ones. If no properties passed, publish
  // the entire object.
  //
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


  //`### unpublish`

  //
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

// extend Hoodie
Hoodie.extend('user', Hoodie.User);

// Share Module
// ==============

// When a share gets created, a $share doc gets stored and synched to the user's
// database. From there the $share worker handles the rest:
//
// * creating a share database
// * creating a share user if a password is used (to be done)
// * handling the replications
//
// The worker updates the $share doc status, which gets synched back to the
// frontend. When the user deletes the $share doc, the worker removes the
// database, the user and all replications
//
//
// API
// -----
//
//     // returns a share instance
//     // with share.id set to 'share_id'
//     hoodie.share('share_id')
//
//     // the rest of the API is a standard store API, with the
//     // difference that no type has to be set and the returned
//     // promises are resolved with share instances instead of
//     // simple objects
//     hoodie.share.add(attributes)
//     hoodie.share.find('share_id')
//     hoodie.share.findAll()
//     hoodie.share.findOrAdd(id, attributes)
//     hoodie.share.save(id, attributes)
//     hoodie.share.update(id, changed_attributes)
//     hoodie.share.updateAll(changed_attributes)
//     hoodie.share.remove(id)
//     hoodie.share.removeAll()
//
Hoodie.Share = (function () {

  'use strict';

  // Constructor
  // -------------

  // the constructor returns a function, so it can be called
  // like this: hoodie.share('share_id')
  //
  // The rest of the API is available as usual.
  //
  function Share(hoodie) {
    var api;
    this.hoodie = hoodie;
    this._open = this._open.bind(this);

    // set pointer to Hoodie.ShareInstance
    this.instance = Hoodie.ShareInstance;

    // return custom api which allows direct call
    api = this._open;
    $.extend(api, this);

    this.hoodie.store.decoratePromises({
      shareAt: this._storeShareAt,
      unshareAt: this._storeUnshareAt,
      unshare: this._storeUnshare,
      share: this._storeShare
    });
    return api;
  }


  // add
  // --------

  // creates a new share and returns it
  //
  Share.prototype.add = function (options) {
    var self = this;
    if (options === null) {
      options = {};
    }
    return this.hoodie.store.add('$share', this._filterShareOptions(options)).pipe(function (object) {
      if (!self.hoodie.account.hasAccount()) {
        self.hoodie.account.anonymousSignUp();
      }
      return new self.instance(self.hoodie, object);
    });
  };


  // find
  // ------

  // find an existing share
  //
  Share.prototype.find = function (id) {
    var self = this;
    return this.hoodie.store.find('$share', id).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };


  // findAll
  // ---------

  // find all my existing shares
  //
  Share.prototype.findAll = function () {
    var self = this;
    return this.hoodie.store.findAll('$share').pipe(function (objects) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        obj = objects[_i];
        _results.push(new self.instance(self.hoodie, obj));
      }
      return _results;
    });
  };


  // findOrAdd
  // --------------

  // find or add a new share
  //
  Share.prototype.findOrAdd = function (id, options) {
    var self = this;
    return this.hoodie.store.findOrAdd('$share', id, this._filterShareOptions(options)).pipe(function (object) {
      if (!self.hoodie.account.hasAccount()) {
        self.hoodie.account.anonymousSignUp();
      }
      return new self.instance(self.hoodie, object);
    });
  };


  // save
  // ------

  // add or overwrite a share
  //
  Share.prototype.save = function (id, options) {
    var self = this;
    return this.hoodie.store.save('$share', id, this._filterShareOptions(options)).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };


  // update
  // --------

  // add or overwrite a share
  //
  Share.prototype.update = function (id, changed_options) {
    var self = this;
    return this.hoodie.store.update('$share', id, this._filterShareOptions(changed_options)).pipe(function (object) {
      return new self.instance(self.hoodie, object);
    });
  };


  // updateAll
  // -----------

  // update all my existing shares
  //
  Share.prototype.updateAll = function (changed_options) {
    var self = this;
    return this.hoodie.store.updateAll('$share', this._filterShareOptions(changed_options)).pipe(function (objects) {
      var obj, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = objects.length; _i < _len; _i++) {
        obj = objects[_i];
        _results.push(new self.instance(self.hoodie, obj));
      }
      return _results;
    });
  };


  // remove
  // ---------

  // deletes an existing share
  //
  Share.prototype.remove = function (id) {
    this.hoodie.store.findAll(function (obj) {
      return obj.$shares[id];
    }).unshareAt(id);
    return this.hoodie.store.remove('$share', id);
  };


  // removeAll
  // ------------

  // delete all existing shares
  //
  Share.prototype.removeAll = function () {
    this.hoodie.store.findAll(function (obj) {
      return obj.$shares;
    }).unshare();
    return this.hoodie.store.removeAll('$share');
  };


  // Private
  //---------

  Share.prototype._allowedOptions = ["id", "access", "createdBy"];


  // ### filter share options
  //
  Share.prototype._filterShareOptions = function (options) {
    var filteredOptions, option, _i, _len, _ref;
    options = options || {};

    filteredOptions = {};
    _ref = this._allowedOptions;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      option = _ref[_i];
      if (options.hasOwnProperty(option)) {
        filteredOptions[option] = options[option];
      }
    }
    return filteredOptions;
  };


  // ### open

  // opens a a remote share store, returns a Hoodie.Remote instance
  //
  Share.prototype._open = function (shareId, options) {
    options = options || {};
    $.extend(options, {
      id: shareId
    });
    return new this.instance(this.hoodie, options);
  };


  // hoodie.store decorations
  // --------------------------

  // hoodie.store decorations add custom methods to promises returned
  // by hoodie.store methods like find, add or update. All methods return
  // methods again that will be executed in the scope of the promise, but
  // with access to the current hoodie instance
  //

  // ### shareAt

  //
  Share.prototype._storeShareAt = function (shareId) {
    var self = this;
    return this.pipe(function (objects) {
      var object, updateObject, _i, _len, _results;
      updateObject = function (object) {
        self.hoodie.store.update(object.type, object.id, {
          $sharedAt: shareId
        });
        return object;
      };
      if ($.isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(updateObject(object));
        }
        return _results;
      } else {
        return updateObject(objects);
      }
    });
  };


  // ### unshareAt

  //
  Share.prototype._storeUnshareAt = function (shareId) {
    var self = this;
    return this.pipe(function (objects) {
      var object, updateObject, _i, _len, _results;

      updateObject = function (object) {
        if (object.$sharedAt !== shareId) {
          return object;
        }
        self.hoodie.store.update(object.type, object.id, {
          $unshared: true
        });
        return object;
      };

      if ($.isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(updateObject(object));
        }
        return _results;
      } else {
        return updateObject(objects);
      }
    });
  };


  // ### unshare

  //
  Share.prototype._storeUnshare = function () {
    var self = this;
    return this.pipe(function (objects) {
      var object, updateObject, _i, _len, _results;
      updateObject = function (object) {
        if (!object.$sharedAt) {
          return object;
        }
        self.hoodie.store.update(object.type, object.id, {
          $unshared: true
        });
        return object;
      };
      if ($.isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          object = objects[_i];
          _results.push(updateObject(object));
        }
        return _results;
      } else {
        return updateObject(objects);
      }
    });
  };


  // ### share

  //
  Share.prototype._storeShare = function () {
    var self = this;

    return this.pipe(function (objects) {
      return self.hoodie.share.add().pipe(function (newShare) {
        var object, updateObject, value;
        updateObject = function (object) {
          self.hoodie.store.update(object.type, object.id, {
            $sharedAt: newShare.id
          });
          return object;
        };
        value = (function () {
          var _i, _len, _results;
          if ($.isArray(objects)) {
            _results = [];
            for (_i = 0, _len = objects.length; _i < _len; _i++) {
              object = objects[_i];
              _results.push(updateObject(object));
            }
            return _results;
          } else {
            return updateObject(objects);
          }
        })();
        return self.hoodie.defer().resolve(value, newShare).promise();
      });
    });
  };

  return Share;

})();

// extend Hoodie
Hoodie.extend('share', Hoodie.Share);

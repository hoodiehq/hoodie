// Share Instance
// ========================

// A share instance provides an API to interact with a
// share. It's extending the default Remote Store by methods
// to grant or revoke read / write access.
//
// By default, a share is only accessible to me. If I want
// it to share it, I explicatly need to grant access
// by calling `share.grantReadAccess()`. I can also grant
// access to only specific users by passing an array:
// `share.grantReadAccess(['joe','lisa'])`
//
// It's plannend to secure a public share with a password,
// but this feature is not yet implemented.
//
// To subscribe to a share created by somebody else, run
// this code: `hoodie.share('shareId').subscribe()`.
//
Hoodie.ShareInstance = (function(_super) {

  'use strict';

  // constructor
  // -------------

  // initializes a new share
  //
  function ShareInstance(hoodie, options) {
    this.hoodie = hoodie;

    options = options || {};

    this._handleSecurityResponse = this._handleSecurityResponse.bind(this);
    this._objectBelongsToMe = this._objectBelongsToMe.bind(this);

    // make sure that we have an id
    this.id = options.id || this.hoodie.uuid();

    // set name from id
    this.name = "share/" + this.id;

    // set prefix from name
    this.prefix = this.name;

    // set options
    $.extend(this, options);

    ShareInstance.__super__.constructor.apply(this, arguments);
  }

  Object.deepExtend(ShareInstance, _super);


  // default values
  // ----------------

  // shares are not accessible to others by default.
  //
  ShareInstance.prototype.access = false;


  // subscribe
  // ---------

  //
  //
  ShareInstance.prototype.subscribe = function() {
    return this.request('GET', '/_security').pipe(this._handleSecurityResponse);
  };


  // unsubscribe
  // -----------

  //
  //
  ShareInstance.prototype.unsubscribe = function() {
    this.hoodie.share.remove(this.id);
    this.hoodie.store.removeAll(this._objectBelongsToMe, {
      local: true
    });
    return this;
  };


  // grant read access
  // -------------------

  // grant read access to the share. If no users passed,
  // everybody can read the share objects. If one or multiple
  // users passed, only these users get read access.
  //
  // examples:
  //
  //     share.grantReadAccess()
  //     share.grantReadAccess('joe@example.com')
  //     share.grantReadAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.grantReadAccess = function(users) {
    var currentUsers, user, _i, _len;

    if (this.access === true || this.access.read === true) {
      return this.hoodie.resolveWith(this);
    }

    if (typeof users === 'string') {
      users = [users];
    }

    if (this.access === false || this.access.read === false) {
      if (this.access.read !== undefined) {
        this.access.read = users || true;
      } else {
        this.access = users || true;
      }
    }

    if (users) {
      currentUsers = this.access.read || this.access;

      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        if (currentUsers.indexOf(user) === -1) {
          currentUsers.push(user);
        }
      }

      this.access.read !== undefined ? this.access.read = currentUsers : this.access = currentUsers;
    } else {
      this.access.read !== undefined ? this.access.read = true : this.access = true;
    }

    return this.hoodie.share.update(this.id, {
      access: this.access
    });

  };


  // revoke read access
  // --------------------

  // revoke read access to the share. If one or multiple
  // users passed, only these users' access gets revoked.
  // Revoking reading access always includes revoking write
  // access as well.
  //
  // examples:
  //
  //     share.revokeReadAccess()
  //     share.revokeReadAccess('joe@example.com')
  //     share.revokeReadAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.revokeReadAccess = function(users) {
    var changed, currentUsers, idx, user, _i, _len;
    this.revokeWriteAccess(users);
    if (this.access === false || this.access.read === false) {
      return this.hoodie.resolveWith(this);
    }
    if (users) {
      if (this.access === true || this.access.read === true) {
        return this.hoodie.rejectWith(this);
      }
      if (typeof users === 'string') {
        users = [users];
      }
      currentUsers = this.access.read || this.access;
      changed = false;
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        idx = currentUsers.indexOf(user);
        if (idx !== -1) {
          currentUsers.splice(idx, 1);
          changed = true;
        }
      }
      if (!changed) {
        return this.hoodie.resolveWith(this);
      }
      if (currentUsers.length === 0) {
        currentUsers = false;
      }
      if (this.access.read !== undefined) {
        this.access.read = currentUsers;
      } else {
        this.access = currentUsers;
      }
    } else {
      this.access = false;
    }
    return this.hoodie.share.update(this.id, {
      access: this.access
    });
  };


  // grant write access
  // --------------------

  // grant write access to the share. If no users passed,
  // everybody can edit the share objects. If one or multiple
  // users passed, only these users get write access. Granting
  // writing reads always also includes reading rights.
  //
  // examples:
  //
  //     share.grantWriteAccess()
  //     share.grantWriteAccess('joe@example.com')
  //     share.grantWriteAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.grantWriteAccess = function(users) {
    this.grantReadAccess(users);

    if (this.access.read === undefined) {
      this.access = {
        read: this.access
      };
    }
    if (this.access.write === true) {
      return this.hoodie.resolveWith(this);
    }
    if (users) {
      if (typeof users === 'string') {
        users = [users];
      }
      this.access.write = users;
    } else {
      this.access.write = true;
    }
    return this.hoodie.share.update(this.id, {
      access: this.access
    });
  };


  // revoke write access
  // --------------------

  // revoke write access to the share. If one or multiple
  // users passed, only these users' write access gets revoked.
  //
  // examples:
  //
  //     share.revokeWriteAccess()
  //     share.revokeWriteAccess('joe@example.com')
  //     share.revokeWriteAccess(['joe@example.com', 'lisa@example.com'])
  //
  ShareInstance.prototype.revokeWriteAccess = function(users) {
    var idx, user, _i, _len;

    if (this.access.write === undefined) {
      return this.hoodie.resolveWith(this);
    }
    if (users) {
      if (typeof this.access.write === 'boolean') {
        return this.hoodie.rejectWith(this);
      }
      if (typeof users === 'string') {
        users = [users];
      }
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        idx = this.access.write.indexOf(user);
        if (idx !== -1) {
          this.access.write.splice(idx, 1);
        }
      }
      if (this.access.write.length === 0) {
        this.access = this.access.read;
      }
    } else {
      this.access = this.access.read;
    }
    return this.hoodie.share.update(this.id, {
      access: this.access
    });
  };


  // PRIVATE
  // ---------

  // 
  // 
  ShareInstance.prototype._objectBelongsToMe = function(object) {
    return object.$sharedAt === this.id;
  };

  // 
  // 
  ShareInstance.prototype._handleSecurityResponse = function(security) {
    var access, createdBy;
    access = this._parseSecurity(security);
    createdBy = '$subscription';
    return this.hoodie.share.findOrAdd(this.id, {
      access: access,
      createdBy: createdBy
    });
  };


  // a db _security response looks like this:
  //
  //     {
  //       members: {
  //           names: [],
  //           roles: ["1ihhzfy"]
  //       },
  //       writers: {
  //           names: [],
  //           roles: ["1ihhzfy"]
  //       }
  //     }
  //
  // we want to turn it into
  //
  //     {read: true, write: true}
  //
  // given that users ownerHash is "1ihhzfy"
  //
  ShareInstance.prototype._parseSecurity = function(security) {
    var access, read, write, _ref, _ref1;
    read = (_ref = security.members) !== null ? _ref.roles : void 0;
    write = (_ref1 = security.writers) !== null ? _ref1.roles : void 0;
    access = {};

    if (read !== undefined) {
      access.read = read === true || read.length === 0;
      if (read.length) {
        access.read = -1 !== read.indexOf(this.hoodie.account.ownerHash);
      }
    }

    if (write !== undefined) {
      access.write = write === true || write.length === 0;
      if (write.length) {
        access.write = -1 !== write.indexOf(this.hoodie.account.ownerHash);
      }
    }
    return access;
  };

  return ShareInstance;

})(Hoodie.Remote);

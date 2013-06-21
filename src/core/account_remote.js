// AccountRemote
// ===============

// Connection / Socket to our couch
//
// AccountRemote is using CouchDB's `_changes` feed to
// listen to changes and `_bulk_docs` to push local changes
//
// When hoodie.remote is continuously syncing (default),
// it will continuously  synchronize with local store,
// otherwise sync, pull or push can be called manually
//
Hoodie.AccountRemote = (function(_super) {

  'use strict';

  function AccountRemote(hoodie, options) {
    this.hoodie = hoodie;
    options = options || {};
    this._handleSignIn = this._handleSignIn.bind(this);
    this._connect = this._connect.bind(this);
    this.push = this.push.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.connect = this.connect.bind(this);

    // set name to user's DB name
    this.name = this.hoodie.account.db();

    // we're always connected to our own db
    this.connected = true;

    // do not prefix files for my own remote
    options.prefix = '';

    this.hoodie.on('account:signin', this._handleSignIn);
    this.hoodie.on('account:reauthenticated', this._connect);
    this.hoodie.on('account:signout', this.disconnect);
    this.hoodie.on('reconnected', this.connect);
    AccountRemote.__super__.constructor.call(this, this.hoodie, options);

    // preset known objects with localstore.
    this.bootstrapKnownObjects();
  }

  Object.deepExtend(AccountRemote, _super);

  // connect by default
  AccountRemote.prototype.connected = true;


  // Connect
  // ---------
  //
  // do not start to connect immediately, but authenticate beforehand
  //
  AccountRemote.prototype.connect = function() {
    return this.hoodie.account.authenticate().pipe(this._connect);
  };


  // disconnect
  // ------------
  //
  //
  AccountRemote.prototype.disconnect = function() {
    this.hoodie.unbind('store:idle', this.push);
    return AccountRemote.__super__.disconnect.apply(this, arguments);
  };


  // bootstrapKnownObjects
  // -----------------------
  //
  //
  AccountRemote.prototype.bootstrapKnownObjects = function() {
    var id, key, type, _i, _len, _ref, _ref1, _results = [];
    _ref = this.hoodie.store.index();

    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      _ref1 = key.split(/\//),
      type = _ref1[0],
      id = _ref1[1];

      _results.push(this.markAsKnownObject({
        type: type,
        id: id
      }));
    }
    return _results;
  };


  // get and set since nr
  // ----------------------
  // we store the last since number from the current user's store
  // in his config
  //
  AccountRemote.prototype.getSinceNr = function() {
    return this.hoodie.config.get('_remote.since') || 0;
  };

  AccountRemote.prototype.setSinceNr = function(since) {
    return this.hoodie.config.set('_remote.since', since);
  };


  // push
  // ------
  //
  // if no objects passed to be pushed, we default to
  // changed objects in user's local store
  //
  AccountRemote.prototype.push = function(objects) {
    if (!this.isConnected()) {
      var error = new window.ConnectionError("Not connected: could not push local changes to remote");
      return this.hoodie.rejectWith(error);
    }

    if (!$.isArray(objects)) {
      objects = this.hoodie.store.changedObjects();
    }

    var promise = AccountRemote.__super__.push.call(this, objects);
    promise.fail(this.hoodie.checkConnection);

    return promise;
  };


  // Events
  // --------
  //
  // namespaced alias for `hoodie.on`
  //
  AccountRemote.prototype.on = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.on(event, cb);
  };

  AccountRemote.prototype.one = function(event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.one(event, cb);
  };


  //
  // namespaced alias for `hoodie.trigger`
  //
  AccountRemote.prototype.trigger = function() {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];

    return (_ref = this.hoodie).trigger.apply(_ref, ["remote:" + event].concat(Array.prototype.slice.call(parameters)));
  };


  //
  AccountRemote.prototype._connect = function() {
    this.connected = true;
    this.hoodie.on('store:idle', this.push);
    return this.sync();
  };


  //
  AccountRemote.prototype._handleSignIn = function() {
    this.name = this.hoodie.account.db();
    return this._connect();
  };

  return AccountRemote;

})(Hoodie.Remote);

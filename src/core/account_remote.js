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

var __bind = function (fn, me) { return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

Hoodie.AccountRemote = (function (_super) {

  'use strict';

  function AccountRemote(hoodie, options) {
    this.hoodie = hoodie;
    if (options === null) {
      options = {};
    }
    this._handleSignIn = __bind(this._handleSignIn, this);
    this._connect = __bind(this._connect, this);
    this.push = __bind(this.push, this);
    this.disconnect = __bind(this.disconnect, this);
    this.connect = __bind(this.connect, this);
    this.name = this.hoodie.account.db();
    this.connected = true;
    options.prefix = '';
    this.hoodie.on('account:signin', this._handleSignIn);
    this.hoodie.on('account:reauthenticated', this._connect);
    this.hoodie.on('account:signout', this.disconnect);
    this.hoodie.on('reconnected', this.connect);
    AccountRemote.__super__.constructor.call(this, this.hoodie, options);
    this.bootstrapKnownObjects();
  }

  $.extend(AccountRemote, _super);

  AccountRemote.prototype.connected = true;

  AccountRemote.prototype.connect = function () {
    return this.hoodie.account.authenticate().pipe(this._connect);
  };

  AccountRemote.prototype.disconnect = function () {
    this.hoodie.unbind('store:idle', this.push);
    return AccountRemote.__super__.disconnect.apply(this, arguments);
  };

  AccountRemote.prototype.bootstrapKnownObjects = function () {
    var id, key, type, _i, _len, _ref, _ref1, _results;
    _ref = this.hoodie.store.index();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      _ref1 = key.split(/\//), type = _ref1[0], id = _ref1[1];
      _results.push(this.markAsKnownObject({
        type: type,
        id: id
      }));
    }
    return _results;
  };

  AccountRemote.prototype.getSinceNr = function () {
    return this.hoodie.config.get('_remote.since') || 0;
  };

  AccountRemote.prototype.setSinceNr = function (since) {
    return this.hoodie.config.set('_remote.since', since);
  };

  AccountRemote.prototype.push = function (objects) {
    var error, promise;

    if (!this.isConnected()) {
      error = new ConnectionError("Not connected: could not push local changes to remote");
      return this.hoodie.rejectWith(error);
    }

    if (!$.isArray(objects)) {
      objects = this.hoodie.store.changedObjects();
    }

    promise = AccountRemote.__super__.push.call(this, objects);
    promise.fail(this.hoodie.checkConnection);

    return promise;
  };

  AccountRemote.prototype.on = function (event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.on(event, cb);
  };

  AccountRemote.prototype.one = function (event, cb) {
    event = event.replace(/(^| )([^ ]+)/g, "$1remote:$2");
    return this.hoodie.one(event, cb);
  };

  AccountRemote.prototype.trigger = function () {
    var event, parameters, _ref;

    event = arguments[0],
    parameters = 2 <= arguments.length ? __slice.call(arguments, 1) : [];

    return (_ref = this.hoodie).trigger.apply(_ref, ["remote:" + event].concat(__slice.call(parameters)));
  };

  AccountRemote.prototype._connect = function () {
    this.connected = true;
    this.hoodie.on('store:idle', this.push);
    return this.sync();
  };

  AccountRemote.prototype._handleSignIn = function () {
    this.name = this.hoodie.account.db();
    return this._connect();
  };

  return AccountRemote;

})(Hoodie.Remote);

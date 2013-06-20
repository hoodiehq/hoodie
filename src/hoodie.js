var Hoodie,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Hoodie = (function(_super) {

  function Hoodie(baseUrl) {
    this.baseUrl = baseUrl;
    this._handleCheckConnectionError = __bind(this._handleCheckConnectionError, this);
    this._handleCheckConnectionSuccess = __bind(this._handleCheckConnectionSuccess, this);
    this.rejectWith = __bind(this.rejectWith, this);
    this.resolveWith = __bind(this.resolveWith, this);
    this.reject = __bind(this.reject, this);
    this.resolve = __bind(this.resolve, this);
    this.checkConnection = __bind(this.checkConnection, this);
    if (this.baseUrl) {
      this.baseUrl = this.baseUrl.replace(/\/+$/, '');
    } else {
      this.baseUrl = "/_api";
    }
    this.store = new this.constructor.LocalStore(this);
    this.config = new this.constructor.Config(this);
    this.account = new this.constructor.Account(this);
    this.remote = new this.constructor.AccountRemote(this);
    this._loadExtensions();
    this.checkConnection();
  }

  __extends(Hoodie, _super);

  Hoodie.prototype.online = true;

  Hoodie.prototype.checkConnectionInterval = 30000;

  Hoodie.prototype.request = function(type, url, options) {
    var defaults;

    if (options === null) {
      options = {};
    }

    if (!/^http/.test(url)) {
      url = "" + this.baseUrl + url;
    }

    defaults = {
      type: type,
      url: url,
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true,
      dataType: 'json'
    };

    return $.ajax($.extend(defaults, options));

  };

  Hoodie.prototype._checkConnectionRequest = null;

  Hoodie.prototype.checkConnection = function() {
    var _ref;

    if (((_ref = this._checkConnectionRequest) != null ? typeof _ref.state === "function" ? _ref.state() : null : null) === 'pending') {
      return this._checkConnectionRequest;
    }
    return this._checkConnectionRequest = this.request('GET', '/').pipe(this._handleCheckConnectionSuccess, this._handleCheckConnectionError);
  };

  Hoodie.prototype.open = function(storeName, options) {
    if (options == null) {
      options = {};
    }
    $.extend(options, {
      name: storeName
    });
    return new Hoodie.Remote(this, options);
  };

  Hoodie.prototype.uuid = function(len) {
    var chars, i, radix;
    if (len == null) {
      len = 7;
    }
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;
    return ((function() {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        _results.push(chars[0 | Math.random() * radix]);
      }
      return _results;
    })()).join('');
  };

  Hoodie.prototype.defer = $.Deferred;

  Hoodie.prototype.isPromise = function(obj) {
    return typeof (obj != null ? obj.done : null) === 'function' && typeof obj.resolve === 'undefined';
  };

  Hoodie.prototype.resolve = function() {
    return this.defer().resolve().promise();
  };

  Hoodie.prototype.reject = function() {
    return this.defer().reject().promise();
  };

  Hoodie.prototype.resolveWith = function() {
    var _ref;
    return (_ref = this.defer()).resolve.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.rejectWith = function() {
    var _ref;
    return (_ref = this.defer()).reject.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.dispose = function() {
    return this.trigger('dispose');
  };

  Hoodie.extend = function(name, Module) {
    this._extensions = this._extensions || {};
    this._extensions[name] = Module;

    return this._extensions[name];
  };

  Hoodie.prototype.extend = function(name, Module) {
    this[name] = new Module(this);
    return this[name];
  };

  Hoodie.prototype._loadExtensions = function() {
    var Module, instanceName, _ref, _results;
    _ref = this.constructor._extensions;
    _results = [];

    for (instanceName in _ref) {
      if (_ref.hasOwnProperty(instanceName)) {
        Module = _ref[instanceName];
        _results.push(this[instanceName] = new Module(this));
      }

    }
    return _results;
  };

  Hoodie.prototype._handleCheckConnectionSuccess = function() {
    this.checkConnectionInterval = 30000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (!this.online) {
      this.trigger('reconnected');
      this.online = true;
    }

    return this.defer().resolve();
  };

  Hoodie.prototype._handleCheckConnectionError = function() {
    this.checkConnectionInterval = 3000;

    window.setTimeout(this.checkConnection, this.checkConnectionInterval);

    if (this.online) {
      this.trigger('disconnected');
      this.online = false;
    }

    return this.defer().reject();
  };

  return Hoodie;

})(Events);


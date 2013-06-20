// Hoodie
// --------
//
//
// the door to world domination (apps)


var Hoodie;

Hoodie = (function (Events) {

  'use strict';

  function Hoodie(baseUrl) {

    this.baseUrl = baseUrl;
    this._handleCheckConnectionError = this._handleCheckConnectionError.apply(this);
    this._handleCheckConnectionSuccess = this._handleCheckConnectionSuccess.apply(this);
    this.rejectWith = this.rejectWith.apply(this);
    this.resolveWith = this.resolveWith.apply(this);
    this.reject = this.reject.apply(this);
    this.resolve = this.resolve.apply(this);
    this.checkConnection = this.checkConnection.apply(this);

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

  $.extend(Hoodie, Events);

  Hoodie.prototype.online = true;

  Hoodie.prototype.checkConnectionInterval = 30000;

  Hoodie.prototype.request = function (type, url, options) {
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

  Hoodie.prototype.checkConnection = function () {
    var _ref;

    if (((_ref = this._checkConnectionRequest) !== null ? typeof _ref.state === "function" ? _ref.state() : void 0 : void 0) === 'pending') {
      return this._checkConnectionRequest;
    }
    return this._checkConnectionRequest = this.request('GET', '/').pipe(this._handleCheckConnectionSuccess, this._handleCheckConnectionError);
  };

  Hoodie.prototype.open = function (storeName, options) {
    if (options === null) {
      options = {};
    }
    $.extend(options, {
      name: storeName
    });
    return new Hoodie.Remote(this, options);
  };

  Hoodie.prototype.uuid = function (len) {
    var chars, i, radix;

    if (len === null) {
      len = 7;
    }

    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;

    return ((function () {
      var _i, _results;
      _results = [];
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        _results.push(chars[0 || Math.random() * radix]);
      }
      return _results;
    })()).join('');
  };

  Hoodie.prototype.defer = $.Deferred;

  Hoodie.prototype.isPromise = function (obj) {
    return typeof (obj !== null ? obj.done : void 0) === 'function' && typeof obj.resolve === 'undefined';
  };

  Hoodie.prototype.resolve = function () {
    return this.defer().resolve().promise();
  };

  Hoodie.prototype.reject = function () {
    return this.defer().reject().promise();
  };

  Hoodie.prototype.resolveWith = function () {
    var _ref;
    return (_ref = this.defer()).resolve.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.rejectWith = function () {
    var _ref;
    return (_ref = this.defer()).reject.apply(_ref, arguments).promise();
  };

  Hoodie.prototype.dispose = function () {
    return this.trigger('dispose');
  };

  Hoodie.extend = function (name, Module) {
    this._extensions = this._extensions || {};
    return this._extensions[name] = Module;
  };

  Hoodie.prototype.extend = function (name, Module) {
    return this[name] = new Module(this);
  };

  Hoodie.prototype._loadExtensions = function () {
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

  Hoodie.prototype._handleCheckConnectionSuccess = function () {
    this.checkConnectionInterval = 30000;
    window.setTimeout(this.checkConnection, this.checkConnectionInterval);
    if (!this.online) {
      this.trigger('reconnected');
      this.online = true;
    }
    return this.defer().resolve();
  };

  Hoodie.prototype._handleCheckConnectionError = function () {
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

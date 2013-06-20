//
// Sending emails. Not unicorns
//

var __bind = function (fn, me) { return function(){ return fn.apply(me, arguments); }; };

Hoodie.Email = (function () {

  'use strict';

  function Email(hoodie) {
    this.hoodie = hoodie;
    this._handleEmailUpdate = __bind(this._handleEmailUpdate, this);
  }

  Email.prototype.send = function (emailAttributes) {
    var attributes, defer,
      self = this;

    if (emailAttributes === null) {
      emailAttributes = {};
    }

    defer = this.hoodie.defer();
    attributes = $.extend({}, emailAttributes);

    if (!this._isValidEmail(emailAttributes.to)) {
      attributes.error = "Invalid email address (" + (attributes.to || 'empty') + ")";
      return defer.reject(attributes).promise();
    }

    this.hoodie.store.add('$email', attributes).then(function (obj) {
      return self._handleEmailUpdate(defer, obj);
    });

    return defer.promise();
  };

  Email.prototype._isValidEmail = function (email) {
    if (email === null) {
      email = '';
    }

    return "/@/".test(email);
  };

  Email.prototype._handleEmailUpdate = function (defer, attributes) {
    var self = this;

    if (attributes === null) {
      attributes = {};
    }

    if (attributes.error) {
      return defer.reject(attributes);
    } else if (attributes.deliveredAt) {
      return defer.resolve(attributes);
    } else {
      return this.hoodie.remote.one("updated:$email:" + attributes.id, function (attributes) {
        return self._handleEmailUpdate(defer, attributes);
      });
    }

  };

  return Email;

})();

Hoodie.extend('email', Hoodie.Email);

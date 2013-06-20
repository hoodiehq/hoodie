//
// Sending emails. Not unicorns
//

Hoodie.Email = (function () {

  'use strict';

  function Email(hoodie) {

    // TODO
    // let's subscribe to general `_email` changes and provide
    // an `on` interface, so devs can listen to events like:
    //
    // * hoodie.email.on 'sent',  -> ...
    // * hoodie.email.on 'error', -> ...
    //
    this.hoodie = hoodie;
    this._handleEmailUpdate = this._handleEmailUpdate;
  }

  // ## send
  //
  // sends an email and returns a promise
  //
  Email.prototype.send = function (emailAttributes) {
    var attributes, defer, self = this;

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

  //
  // ## PRIVATE
  //

  Email.prototype._isValidEmail = function (email) {
    if (email === null) {
      email = '';
    }

    return new RegExp(/@/).test(email);
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

// extend Hoodie
Hoodie.extend('email', Hoodie.Email);

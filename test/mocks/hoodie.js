var store = require('./store');
var task  = require('./task');
var promise = require('./promises');
var events = require('./events');

module.exports = function () {

  'use strict';

  var api = {
    baseUrl: 'http://my.cou.ch',
    trigger: events.trigger,
    request: function () {},
    checkConnection: function () {},
    open: function () {},
    on: events.bind,
    one: events.one,
    unbind: events.unbind,
    defer: $.Deferred,
    isPromise: function(object) {
      return !! (object &&
                 typeof object.done === 'function' &&
                 typeof object.resolve !== 'function');
    },
    generateId: function () {
      return 'uuid';
    },
    resolve: function() {
      return $.Deferred().resolve().promise();
    },
    resolveWith: function () {
      var _ref;
      return (_ref = $.Deferred()).resolve.apply(_ref, arguments).promise();
    },
    reject: function() {
      return $.Deferred().reject().promise();
    },
    rejectWith: function () {
      var _ref;
      return (_ref = $.Deferred()).reject.apply(_ref, arguments).promise();
    },
    store: store(),
    task: task(),
    account: {
      authenticate: function () {
        return promise();
      },
      db: function () {},
      on: function () {},
      ownerHash: 'owner_hash',
      hasAccount: function () {},
      anonymousSignUp: function () {}
    },
    config: {
      set: function () {},
      get: function () {},
      unset: function () {},
      clear: function () {}
    },
    remote: {
      connect: function () {},
      disconnect: function () {},
      sync: function () {},
      on: function () {},
      one: function () {},
      trigger: function () {},
      push: function () {}
    }
  };

  return api;
};

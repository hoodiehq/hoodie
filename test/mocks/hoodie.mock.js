var promiseMock;
var hoodieEvents = require('../../src/hoodie/events');

promiseMock = {
  pipe: function () {},
  fail: function () {},
  done: function () {},
  then: function () {}
};

module.exports = function () {

  'use strict';
  var events = {};
  hoodieEvents(events);

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
    store: Mocks.StoreApi(),
    task: Mocks.hoodieTask(),
    account: {
      authenticate: function () {
        return promiseMock;
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

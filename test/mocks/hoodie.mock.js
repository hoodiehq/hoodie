var promiseMock;

var Mocks = window.Mocks || {};

promiseMock = {
  pipe: function () {},
  fail: function () {},
  done: function () {},
  then: function () {}
};

Mocks.Hoodie = function () {

  'use strict';

  return {
    baseUrl: 'http://my.cou.ch',
    trigger: Hoodie.prototype.trigger,
    request: function () {},
    checkConnection: function () {},
    open: function () {},
    on: Hoodie.prototype.on,
    one: Hoodie.prototype.one,
    unbind: Hoodie.prototype.unbind,
    defer: $.Deferred,
    isPromise: Hoodie.prototype.isPromise,
    uuid: function () {
      return 'uuid';
    },
    resolveWith: function () {
      var _ref;
      return (_ref = $.Deferred()).resolve.apply(_ref, arguments).promise();
    },
    rejectWith: function () {
      var _ref;
      return (_ref = $.Deferred()).reject.apply(_ref, arguments).promise();
    },
    store: {
      add: function () {
        return promiseMock;
      },
      remove: function () {
        return promiseMock;
      },
      save: function () {
        return promiseMock;
      },
      update: function () {
        return promiseMock;
      },
      updateAll: function () {
        return promiseMock;
      },
      find: function () {
        return promiseMock;
      },
      findAll: function () {
        return promiseMock;
      },
      findOrAdd: function () {
        return promiseMock;
      },
      removeAll: function () {
        return promiseMock;
      },
      index: function () {
        return [];
      },
      changedObjects: function () {},
      isDirty: function () {},
      decoratePromises: function () {},
      db: {
        getItem: function () {},
        setItem: function () {},
        removeItem: function () {}
      }
    },
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
      remove: function () {},
      clear: function () {}
    },
    remote: {
      connect: function () {},
      disconnect: function () {},
      sync: function () {},
      on: function () {},
      one: function () {},
      trigger: function () {}
    },
    share: {
      add: function () {
        return promiseMock;
      },
      remove: function () {
        return promiseMock;
      },
      save: function () {
        return promiseMock;
      },
      update: function () {
        return promiseMock;
      },
      updateAll: function () {
        return promiseMock;
      },
      find: function () {
        return promiseMock;
      },
      findAll: function () {
        return promiseMock;
      },
      findOrAdd: function () {
        return promiseMock;
      },
      removeAll: function () {
        return promiseMock;
      },
      request: function () {
        return promiseMock;
      }
    }
  };
};

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
    uuid: function () {
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
    store: function() {},
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

  var storeApi = {
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
    changedObjects: function () { return []; },
    hasLocalChanges: function () {},
    decoratePromises: function () {}
  };

  for(var key in storeApi) {
    if(storeApi.hasOwnProperty(key)) {
      api.store[key] = storeApi[key];
    }
  }

  return api;
};

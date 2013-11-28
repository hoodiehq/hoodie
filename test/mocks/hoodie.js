var store = require('./store');
var task  = require('./task');
var promise = require('./promises');
var events = require('./events');

module.exports = function () {

  'use strict';

  var eventsApi = events.apply(this);
  var promiseApi = promise.apply(this);

  var api = {
    baseUrl: 'http://my.cou.ch',

    // event methods
    trigger: eventsApi.trigger,
    on: eventsApi.bind,
    one: eventsApi.one,
    unbind: eventsApi.unbind,

    // promise methods
    defer: promiseApi.defer,
    isPromise: promiseApi.isPromise,
    resolve: promiseApi.resolve,
    reject: promiseApi.reject,
    resolveWith: promiseApi.resolveWith,
    rejectWith: promiseApi.rejectWith,

    request: function () {},
    checkConnection: function () {},
    open: function () {},
    generateId: function () {
      return 'uuid';
    },

    store: store.apply(this),
    task: task.apply(this),
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

// modules
var account = require('./account');
var localStore = require('./local_store');
var openMethod = require('./open');
var accountRemote = require('./account_remote');
var request = require('./request');
var task = require('./task');
var id = require('./id');

// mixins
var eventsMixin = require('./events');
var promiseMixin = require('./promises');
var connectionMixin = require('./connection');

module.exports = function () {

  'use strict';

  var api = {
    baseUrl: 'https://my.hood.ie',

    // helpers
    request: request.apply(this),
    open: openMethod.apply(this),
    id: id.apply(this),

    // main modules
    store: localStore.apply(this),
    task: task.apply(this),
    account: account.apply(this),
    remote: accountRemote.apply(this),
  };

  // mixin events, promise & connection APIs
  $.extend(api, eventsMixin.apply(this));
  $.extend(api, promiseMixin.apply(this));
  $.extend(api, connectionMixin.apply(this));

  return api;
};

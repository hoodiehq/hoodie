// Store
// ============

// This class defines the API that hoodie.store (local store) and hoodie.open
// (remote store) implement to assure a coherent API. It also implements some
// basic validations.
//
// The returned API provides the following methods:
//
// * validate
// * save
// * add
// * find
// * findOrAdd
// * findAll
// * update
// * updateAll
// * remove
// * removeAll
// * decoratePromises
// * trigger
// * on
// * unbind
//
// At the same time, the returned API can be called as function returning a
// store scoped by the passed type, for example
//
//     var taskStore = hoodie.store('task');
//     taskStore.findAll().then( showAllTasks );
//     taskStore.update('id123', {done: true});
//

//
var hoodieScopedStoreApi = require('../scoped');
var extend = require('extend');

var utils = require('../../../utils');

var helpers = require('./helpers');
var apiMethods = require('./api');

module.exports = function(hoodie, options) {
  var state = {
    // persistence logic
    backend: {},
    hoodie: hoodie,
    // name
    storeName:  options.name || 'store',
    // extend this property with extra functions that will be available
    // on all promises returned by hoodie.store API. It has a reference
    // to current hoodie instance by default
    promiseApi: {
      hoodie: hoodie
    }
  };

  // public API
  var api = function(type, id) {
    var scopedOptions = extend(true, {
      type: type,
      id: id
    }, options);
    return hoodieScopedStoreApi(hoodie, api, scopedOptions);
  };

  state.events = utils.events(hoodie, api, state.storeName);

  // Validate
  // --------------

  // by default, we only check for a valid type & id.
  // the validate method can be overwritten by passing
  // options.validate
  //
  // if `validate` returns nothing, the passed object is
  // valid. Otherwise it returns an error
  //
  api.validate = state.validate = helpers.defaultValidate.bind(null);

  if (typeof options.validate === 'function') {
    api.validate = state.validate = options.validate;
  }

  // required backend methods
  // -------------------------
  if (!options.backend) {
    throw new Error('options.backend must be passed');
  }

  [
    'save',
    'find',
    'findAll',
    'remove',
    'removeAll'
  ].forEach(function(method) {

    if (!options.backend[method]) {
      throw new Error('options.backend.' + method + ' must be passed.');
    }

    state.backend[method] = options.backend[method];
  });

  // public API
  Object.keys(apiMethods).forEach(function(method) {
    if (typeof apiMethods[method] === 'function') {
      api[method] = apiMethods[method].bind(null, state);
    }
  });

  return api;
};

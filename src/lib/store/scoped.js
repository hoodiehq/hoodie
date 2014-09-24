// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//
var utils = require('../../utils');

var exports = module.exports = function (hoodie, storeApi, options) {
  var api = {};
  var id = options.id;
  var storeName = options.name || 'store';
  var type = options.type;

  // add events
  utils.events(
    hoodie,
    api,
    [storeName, type, id].join(':').replace(/:$/,'')
  );

  //
  api.decoratePromises = storeApi.decoratePromises;
  api.validate = storeApi.validate;

  // scoped by both: type & id
  if (id) {
    ['save', 'find', 'update', 'remove'].forEach(function(method) {
      api[method] = exports[method].bind(null, storeApi, type, id);
    });

    return api;
  }

  // scoped by type only
  [
    'save',
    'add',
    'find',
    'findOrAdd',
    'findAll',
    'update',
    'updateAll',
    'remove',
    'removeAll'
  ].forEach(function(method) {
    api[method] = exports[method].bind(null, storeApi, type);
  });

  return api;
};

//
exports.save = function save(storeApi, type, id, properties, options) {
  return storeApi.save(type, id, properties, options);
};

//
exports.add = function add(storeApi, type, properties, options) {
  return storeApi.add(type, properties, options);
};

//
exports.find = function find(storeApi, type, id)  {
  return storeApi.find(type, id);
};

//
exports.findOrAdd = function findOrAdd(storeApi, type, id, properties) {
  return storeApi.findOrAdd(type, id, properties);
};

//
exports.findAll = function findAll(storeApi, type, options) {
  return storeApi.findAll(type, options);
};

//
exports.update = function update(storeApi, type, id, objectUpdate, options) {
  return storeApi.update(type, id, objectUpdate, options);
};

//
exports.updateAll = function updateAll(storeApi, type, objectUpdate, options) {
  return storeApi.updateAll(type, objectUpdate, options);
};

//
exports.remove = function remove(storeApi, type, id, options) {
  return storeApi.remove(type, id, options);
};

//
exports.removeAll = function removeAll(storeApi, type, options) {
  return storeApi.removeAll(type, options);
};

/* exported hoodieScopedStoreApi */
/* jshint unused: false */

// scoped Store
// ============

// same as store, but with type preset to an initially
// passed value.
//

function hoodieScopedStoreApi(hoodie, storeApi, options) {

  // name
  var storeName = options.name || 'store';
  var type = options.type;
  var id = options.id;

  var api = {};

  // scoped by type only
  if (! id) {
    //
    api.save = function save(id, properties, options) {
      return storeApi.save(type, id, properties, options);
    };

    //
    api.add = function add(properties, options) {
      return storeApi.add(type, properties, options);
    };

    //
    api.find = function find(id) {
      return storeApi.find(type, id);
    };

    //
    api.findOrAdd = function findOrAdd(id, properties) {
      return storeApi.findOrAdd(type, id, properties);
    };

    //
    api.findAll = function findAll(options) {
      return storeApi.findAll(type, options);
    };

    //
    api.update = function update(id, objectUpdate, options) {
      return storeApi.update(type, id, objectUpdate, options);
    };

    //
    api.updateAll = function updateAll(objectUpdate, options) {
      return storeApi.updateAll(type, objectUpdate, options);
    };

    //
    api.remove = function remove(id, options) {
      return storeApi.remove(type, id, options);
    };

    //
    api.removeAll = function removeAll(options) {
      return storeApi.removeAll(type, options);
    };

    //
    api.trigger = function trigger() {
      var eventName = arguments[0];
      var parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
      var prefix = storeName + ':' + type;

      return hoodie.trigger.apply(hoodie, [prefix + ':' + eventName].concat(Array.prototype.slice.call(parameters)));
    };

    //
    api.on = function on(eventName, data) {
      var prefix = storeName + ':' + type;
      eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+prefix+':$2');

      return hoodie.on(eventName, data);
    };

    //
    api.unbind = function unbind(eventName, callback) {
      var prefix = storeName + ':' + type;

      eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+prefix+':$2');
      return hoodie.unbind(eventName, callback);
    };
  }

  // scoped by both: type & id
  if (id) {
    //
    api.save = function save(properties, options) {
      return storeApi.save(type, id, properties, options);
    };

    //
    api.find = function find() {
      return storeApi.find(type, id);
    };

    //
    api.update = function update(objectUpdate, options) {
      return storeApi.update(type, id, objectUpdate, options);
    };

    //
    api.remove = function remove(options) {
      return storeApi.remove(type, id, options);
    };

    //
    api.trigger = function trigger() {
      var eventName = arguments[0];
      var parameters = 2 <= arguments.length ? Array.prototype.slice.call(arguments, 1) : [];
      var prefix = storeName + ':' + type + ':' + id;

      return hoodie.trigger.apply(hoodie, [prefix + ':' + eventName].concat(Array.prototype.slice.call(parameters)));
    };

    //
    api.on = function on(eventName, data) {
      var prefix = storeName + ':' + type + ':' + id;
      eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+prefix+':$2');

      return hoodie.on(eventName, data);
    };

    //
    api.unbind = function unbind(eventName, callback) {
      var prefix = storeName + ':' + type + ':' + id;

      eventName = eventName.replace(/(^| )([^ ]+)/g, '$1'+prefix+':$2');
      return hoodie.unbind(eventName, callback);
    };
  }

  //
  api.decoratePromises = storeApi.decoratePromises;
  api.validate = storeApi.validate;

  return api;
}

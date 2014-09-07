var utils = require('../../../utils');
var generateId = utils.generateId;
var helpers = require('./helpers');

// Remote Store Persistence methods
// ----------------------------------
var exports = module.exports;

// find
// ------

// find one object
//
exports.find = function(state, type, id) {
  var path;

  path = type + '/' + id;

  if (state.prefix) {
    path = state.prefix + path;
  }

  path = '/' + encodeURIComponent(path);

  return state.hoodie.remote.request('GET', path)
    .then(helpers.parseFromRemote.bind(null, state));
};


// findAll
// ---------

// find all objects, can be filtered by a type
//
exports.findAll = function(state, type) {
  var endkey, path, startkey;

  path = '/_all_docs?include_docs=true';

  switch (true) {
  case (type !== undefined) && state.prefix !== '':
    startkey = state.prefix + type + '/';
    break;
  case type !== undefined:
    startkey = type + '/';
    break;
  case state.prefix !== '':
    startkey = state.prefix;
    break;
  default:
    startkey = '';
  }

  if (startkey) {

    // make sure that only objects starting with
    // `startkey` will be returned
    endkey = startkey.replace(/.$/, function(chars) {
      var charCode;
      charCode = chars.charCodeAt(0);
      return String.fromCharCode(charCode + 1);
    });
    path = path +
      '&startkey="' +
      (encodeURIComponent(startkey)) +
      '"&endkey="' +
      (encodeURIComponent(endkey)) + '"';
  }

  return state.hoodie.remote.request('GET', path)
    .then(helpers.mapDocsFromFindAll.bind(null, state))
    .then(helpers.parseAllFromRemote.bind(null, state));
};


// save
// ------

// save a new object. If it existed before, all properties
// will be overwritten
//
exports.save = function(state, object) {
  var path;

  if (!object.id) {
    object.id = generateId();
  }

  object = helpers.parseForRemote(state, object);
  path = '/' + encodeURIComponent(object._id);
  return state.hoodie.remote.request('PUT', path, {
    data: object
  });
};


// remove
// ---------

// remove one object
//
exports.remove = function(state, type, id) {
  return state.hoodie.remote.update(type, id, {
    _deleted: true
  });
};


// removeAll
// ------------

// remove all objects, can be filtered by type
//
exports.removeAll = function(state, type) {
  return state.hoodie.remote.updateAll(type, {
    _deleted: true
  });
};

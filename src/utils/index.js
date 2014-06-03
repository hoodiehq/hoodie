exports.config = require('./config');

exports.generate_id = require('./generate_id');

exports.local_storage_wrapper = require('./local_storage_wrapper');

exports.promise = require('./promise');

exports.toPromise = require('pouchdb-topromise');

exports.now = function () {
  return new Date();
};

exports.nowStringified = function () {
  return JSON.stringify(new Date()).replace(/['"]/g, '');
};


if (typeof global.Promise === 'function') {
  exports.Promise = global.Promise;
} else {
  exports.Promise = require('bluebird');
}

exports.config = require('./config');

exports.generate_id = require('./generate_id');

exports.local_storage_wrapper = require('./local_storage_wrapper');

exports.promise = require('./promise');


exports.getArguments = require('argsarray');

exports.toPromise = require('pouchdb-topromise');

exports.now = function () {
  return new Date();
};


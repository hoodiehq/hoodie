module.exports = {
  config: require('./config')(),
  events: require('./events'),
  generateId: require('./generate_id')(),
  localStorageWrapper: require('./local_storage_wrapper')(),
  promise: require('./promise')
};


module.exports = {
  config: require('./config')(),
  events: require('./events'),
  generateId: require('./generate_id')(),
  localStorageWrapper: require('humble-localstorage'),
  promise: require('./promise')
};


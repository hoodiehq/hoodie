module.exports = (function() {
  if (typeof global.Promise === 'function') {
    return global.Promise;
  }
  return require('bluebird');
})();
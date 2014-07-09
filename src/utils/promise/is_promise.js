module.exports = function isPromise (object) {
  return (typeof object.then === 'function');
};


module.exports = function isPromise (object) {
  if (object && object.then) {
    return (typeof object.then === 'function');
  }

  return false;
};


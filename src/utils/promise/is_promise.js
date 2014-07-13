module.exports = function isPromise (object) {
  if (object && object.then) {
    return (typeof object.then === 'function');
  } else {
    return false;
  }
};


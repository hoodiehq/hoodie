exports.isValid = function(pattern, id, customPattern) {
  return (customPattern || pattern).test(id || '');
};

exports.isInvalid = function() {
  return !exports.isValid.apply(null, arguments);
};

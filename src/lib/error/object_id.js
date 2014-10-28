// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object IDs.
//
var HoodieError = require('./error');
var validation = require('./validation');

module.exports = (function() {
  var validIdPattern = /^[a-z0-9\-]+$/;

  function HoodieObjectIdError(properties) {
    properties.name = 'HoodieObjectIdError';
    properties.message = '"{{id}}" is invalid object id. {{rules}}.';

    return new HoodieError(properties);
  }

  HoodieObjectIdError.isValid = validation.isValid.bind(null, validIdPattern);
  HoodieObjectIdError.isInvalid = validation.isInvalid.bind(null, validIdPattern);

  HoodieObjectIdError.prototype.rules = 'Lowercase letters, numbers and dashes allowed only. Must start with a letter';

  return HoodieObjectIdError;
})();

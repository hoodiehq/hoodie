// Hoodie Invalid Type Or Id Error
// -------------------------------

// only lowercase letters, numbers and dashes
// are allowed for object types, plus must start
// with a letter.
//
var HoodieError = require('./error');
var validation = require('./validation');

module.exports = (function() {
  var validTypePattern = /^[a-z$][a-z0-9-]+$/;

  function HoodieObjectTypeError(properties) {
    properties.name = 'HoodieObjectTypeError';
    properties.message = '"{{type}}" is invalid object type. {{rules}}.';

    return new HoodieError(properties);
  }

  HoodieObjectTypeError.isValid = validation.isValid.bind(null, validTypePattern);
  HoodieObjectTypeError.isInvalid = validation.isInvalid.bind(null, validTypePattern);

  HoodieObjectTypeError.prototype.rules = 'lowercase letters, numbers and dashes allowed only. Must start with a letter';

  return HoodieObjectTypeError;
})();


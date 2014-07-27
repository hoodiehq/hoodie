var extend = require('extend');

var error = require('../../error');
var HoodieError = error.error;
var HoodieObjectTypeError = error.objectType;
var HoodieObjectIdError = error.objectId;

// Private
// ---------
var exports = module.exports;

//
exports.decoratePromise = function (state, promise) {
  return extend(promise, state.promiseApi);
};

// / not allowed for id
exports.validIdOrTypePattern = /^[^\/]+$/;
exports.validIdOrTypeRules = '/ not allowed';

exports.defaultValidate = function(object) {

  if (!object) {
    return new HoodieError({
      name: 'InvalidObjectError',
      message: 'No object passed.'
    });
  }

  if (HoodieObjectTypeError.isInvalid(object.type, exports.validIdOrTypePattern)) {
    return new HoodieObjectTypeError({
      type: object.type,
      rules: exports.validIdOrTypeRules
    });
  }

  if (!object.id) {
    return;
  }

  if (HoodieObjectIdError.isInvalid(object.id, exports.validIdOrTypePattern)) {
    return new HoodieObjectIdError({
      id: object.id,
      rules: exports.validIdOrTypeRules
    });
  }
};

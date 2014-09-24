// Hoodie Error
// -------------

// With the custom hoodie error function
// we normalize all errors the get returned
// when using hoodie's rejectWith
//
// The native JavaScript error method has
// a name & a message property. HoodieError
// requires these, but on top allows for
// unlimited custom properties.
//
// Instead of being initialized with just
// the message, HoodieError expects an
// object with properties. The `message`
// property is required. The name will
// fallback to `error`.
//
// `message` can also contain placeholders
// in the form of `{{propertyName}}`` which
// will get replaced automatically with passed
// extra properties.
//
// ### Error Conventions
//
// We follow JavaScript's native error conventions,
// meaning that error names are camelCase with the
// first letter uppercase as well, and the message
// starting with an uppercase letter.
//
var extend = require('extend');

module.exports = (function() {
  var replacePattern = /\{\{\s*\w+\s*\}\}/g;
  var findPropertyPattern = /\w+/;

  function HoodieError(properties) {
    // normalize arguments
    if (typeof properties === 'string') {
      properties = {
        message: properties
      };
    }

    if (!properties.message) {
      properties.message = 'Something went wrong';
    }

    if (!properties.name) {
      properties.name = 'HoodieError';
    }

    // must check for properties, as this.name is always set.
    properties.message = properties.message.replace(replacePattern, function(match) {
      var property = match.match(findPropertyPattern)[0];
      return properties[property];
    });

    extend(this, properties);
  }

  HoodieError.prototype = new Error();
  HoodieError.prototype.constructor = HoodieError;

  return HoodieError;
})();

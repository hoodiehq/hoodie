// uuids consist of numbers and lowercase letters only.
// We stick to lowercase letters to prevent confusion
// and to prevent issues with CouchDB, e.g. database
// names only allow for lowercase letters.

var exports = module.exports = function(chars) {
  chars = chars || '0123456789abcdefghijklmnopqrstuvwxyz'.split('');

  return exports.generateId.bind(null, chars);
};

// helper to generate unique ids.
exports.generateId = function(chars, length) {
  var id = '';
  var radix = chars.length;

  // default uuid length to 7
  if (length === undefined) {
    length = 7;
  }

  for (var i = 0; i < length; i++) {
    var rand = Math.random() * radix;
    var char = chars[Math.floor(rand)];
    id += String(char).charAt(0);
  }

  return id;
};


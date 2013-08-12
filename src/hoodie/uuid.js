/* exported hoodieUUID */

// hoodie.uuid
// =============

// helper to generate unique ids.
function hoodieUUID (hoodie) {
  function uuid(length) {
    var chars, i, radix;

    // default uuid length to 7
    if (length === undefined) {
      length = 7;
    }

    // uuids consist of numbers and lowercase letters only.
    // We stick to lowercase letters to prevent confusion
    // and to prevent issues with CouchDB, e.g. database
    // names do wonly allow for lowercase letters.
    chars = '0123456789abcdefghijklmnopqrstuvwxyz'.split('');
    radix = chars.length;

    // eehmm, yeah.
    return ((function() {
      var _i, _results = [];

      for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
        var rand = Math.random() * radix;
        var char = chars[Math.floor(rand)];
        _results.push(chars[0] = String(char).charAt(0));
      }

      return _results;
    })()).join('');
  }

  //
  // Public API
  //
  hoodie.uuid = uuid;
}

/* exported hoodieUUID */

// hoodie.uuid
// =============

// helper to generate unique ids.
function hoodieUUID (hoodie) {
  function uuid(len) {
    var chars, i, radix;

    // default uuid length to 7
    if (len === undefined) {
      len = 7;
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

      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        var rand = Math.random() * radix;
        _results.push(chars[0] = String(rand).charAt(0));
      }

      return _results;
    })()).join('');
  }

  //
  // Public API
  //
  hoodie.uuid = uuid;
}

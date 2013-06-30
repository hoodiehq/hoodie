// 
// one place to rule them all!
// 

'use strict';

Hoodie.Errors = {

  // INVALID_KEY
  // --------------

  // thrown when invalid keys are used to store an object
  // 
  INVALID_KEY: function (idOrType) {
    var key = idOrType.id ? 'id' : 'type';

    return new Error("invalid " + key + " '" + idOrType[key] + "': numbers and lowercase letters allowed only");
  },

  // INVALID_ARGUMENTS
  // -------------------

  // 
  INVALID_ARGUMENTS: function (msg) {
    return new Error(msg);
  },

  // NOT_FOUND
  // -----------

  // 
  NOT_FOUND: function (type, id) {
    return new Error("" + type + " with " + id + " could not be found");
  }

};

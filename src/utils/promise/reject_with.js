var getDefer = require('./defer');
var HoodieError = require('../../lib/error/error');

//
function rejectWith(errorProperties) {
  var error = new HoodieError(errorProperties);
  return getDefer().reject(error).promise();
}

module.exports = rejectWith;

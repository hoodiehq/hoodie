var defer = require('./defer');
//
function reject() {
  return defer().reject().promise();
}

module.exports = reject;
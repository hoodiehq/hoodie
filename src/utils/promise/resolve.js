var defer = require('./defer');
//
function resolve() {
  return defer().resolve().promise();
}

module.exports = resolve;
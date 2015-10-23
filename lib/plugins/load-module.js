module.exports = function (p) {
  try {
    var mod = require(p)
    return typeof mod === 'function' ? mod : null
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
    return null
  }
}

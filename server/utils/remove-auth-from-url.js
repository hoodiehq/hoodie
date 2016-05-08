module.exports = removeAuth

var parseUrl = require('url').parse

function removeAuth (url) {
  var parts = parseUrl(url)
  return url.replace(parts.auth + '@', '')
}

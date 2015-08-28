var fs = require('fs')
var path = require('path')

var _ = require('lodash')

var globalCache = {}

module.exports = function (data) {
  var store = path.join(data, 'config.json')
  var cache = globalCache[store]

  if (!cache) {
    try {
      cache = globalCache[store] = JSON.parse(fs.readFileSync(store, 'utf8'))
    } catch (e) {
      cache = globalCache[store] = {}
    }
  }

  return {
    get: function (key) {
      if (key) return _.get(cache, key)
      return cache
    },
    set: function (key, value) {
      _.set(cache, key, value)

      fs.writeFileSync(store, JSON.stringify(cache, null, 2) + '\n')
    }
  }
}

/**
 * Dependencies
 */

var _ = require('lodash')
var async = require('async')

/**
 * Make a deep-copy of a JSON-compatible object
 */

function cloneJSON (obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * API for interacting with configuration options.
 *
 * Values are read from the Plugin's config document first, then
 * the global config if not present. Values are only set on the plugin's
 * document (it cannot alter the global config).
 */

exports.ConfigAPI = function (hoodie, options) {
  var config = this

  /**
   * Local cached copy of the config options for quick access
   */

  var app_config = cloneJSON(options.config.app)
  var plugin_config = cloneJSON(options.config.plugin)

  /**
   * An async queue for updating the plugin's config doc. It
   * has a single worker so there should be no races between
   * concurrent requests to the same resource.
   */

  var remote_config = async.queue(function (task, callback) {
    var url = '/plugins/plugin%2F' + options.name
    hoodie.request('GET', url, function (er, doc, res) {
      if (res.statusCode === 404) {
        doc = {config: {}}
      }
      doc.config = _.extend(doc.config, plugin_config)
      hoodie.request('PUT', url, {data: doc}, function (err) {
        if (err) {
          console.error(
            'Error updating config for: ' + options.name + '\n' +
            (err.stack || err.toString)
          )
        }
        callback(err)
      })
    })
  }, 1)

  /**
   * Allows the plugin manager to trigger an update to the app
   * config values available to the plugin.
   */

  config._updateAppConfig = function (config) {
    app_config = config
  }

  /**
   * Allows the plugin manager to trigger an update to the plugin
   * config values available to the plugin.
   */

  config._updatePluginConfig = function (config) {
    plugin_config = config
  }

  /**
   * Get a config value by key. Attempts to read from the plugin-specific
   * config first, then checks the global config if it's not set.
   */

  config.get = function (key) {
    if (plugin_config.hasOwnProperty(key)) {
      return plugin_config[key]
    }
    return app_config[key]
  }

  /**
   * Updates the plugin's config document (and the locally cached object),
   * this will only affect the plugin config, not the global app config.
   */

  config.set = function (key, value) {
    plugin_config[key] = value
    remote_config.push({key: key, value: value})
  }

  return config
}

/**
 * Dependencies
 */

var url = require('url')

var couchr = require('couchr')

var DatabasesAPI = require('./databases').DatabasesAPI
var AccountsAPI = require('./accounts').AccountsAPI
var ConfigAPI = require('./config').ConfigAPI
var TasksAPI = require('./tasks').TasksAPI

/**
 * Top-level plugin API passed to plugins
 */

exports.PluginAPI = function (options) {
  /**
   * All methods are pre-bound - we don't create many of these objects
   * in most situations so having the flexibility to pass them to
   * higher-order functions (eg, async) is nice
   */

  var hoodie = this

  /**
   * Create authenticated URL to make requests with
   */

  var couch_url = url.parse(options.couchdb.url)
  couch_url.auth = options.couchdb.user + ':' + options.couchdb.pass

  /**
   * Resolves a path relative to the authenticated CouchDB URL
   */

  hoodie._resolve = function (path) {
    return url.resolve(couch_url, path)
  }

  /**
   * Makes a HTTP requst to CouchDB, resolving the path relative
   * to the authenticated CouchDB URL - use options.data to send
   * POST / PUT data etc.
   */

  hoodie.request = function (method, path, options, callback) {
    return couchr.request(
      method,
      hoodie._resolve(path),
      options.data,
      options,
      callback
    )
  }

  /**
   * The major parts of the API plugins are likely to interact with
   */

  hoodie.database = new DatabasesAPI(hoodie)
  hoodie.account = new AccountsAPI(hoodie)
  hoodie.task = new TasksAPI(hoodie, options)
  hoodie.config = new ConfigAPI(hoodie, options)

  // simply proxy sendEmail calls to hoodie-plugins-manager
  hoodie.sendEmail = options.sendEmail

  return hoodie
}

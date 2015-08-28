var url = require('url')

var async = require('async')

var PluginAPI = require('../api').PluginAPI
var accounts_api = require('../api/accounts')
var config_manager = require('./config')
var account_manager = require('./account')
var email_manager = require('./email')
var task_manager = require('./task')

exports.start = function (couch_url, callback) {
  var manager = {}

  /**
   * Create authenticated URL to make requests with
   */

  manager.couch_url = couch_url

  /**
   * Resolves a path relative to the authenticated CouchDB URL
   */

  manager._resolve = function (path) {
    return url.resolve(couch_url, path)
  }

  async.parallel({
    config_manager: async.apply(config_manager.start, manager),
    account_manager: async.apply(account_manager.start, manager),
    task_manager: async.apply(task_manager.start, manager)
  },
    function (err, results) {
      if (err) {
        return callback(err)
      }

      var cm = results.config_manager
      var am = results.account_manager
      var tm = results.task_manager

      var em = email_manager.start(cm)

      // update email settings on app config update
      cm.on('appcfg', em.updateConfig)

      manager.createAPI = function (opt) {
        opt.couch_url = opt.couch_url || couch_url
        opt.config = {
          app: cm.getAppConfig(),
          plugin: cm.getPluginConfig(opt.name)
        }
        opt.addSource = tm.addSource
        opt.removeSource = tm.removeSource
        opt.sendEmail = em.sendEmail

        var api = new PluginAPI(opt)
        cm.on('appcfg', api.config._updateAppConfig)
        cm.on('plugincfg', function (name, cfg) {
          if (name === opt.name) {
            api.config._updatePluginConfig(cfg)
          }
        })

        tm.on('change', function (db, change) {
          var doc = JSON.parse(JSON.stringify(change.doc))
          api.task.emit('change', db, doc)
          if (!doc.hasOwnProperty('$processedAt') &&
            !doc.hasOwnProperty('$error') &&
            !doc._deleted) {
            api.task.emit('add', db, doc)
          }
          if (doc.type) {
            var type = doc.type.substr(1)
            api.task.emit(type + ':change', db, doc)
            if (!doc.hasOwnProperty('$processedAt') &&
              !doc.hasOwnProperty('$error') &&
              !doc._deleted) {
              api.task.emit(type + ':add', db, doc)
            }
          }
        })

        am.on('change', function (change) {
          var doc
          if (change.doc) {
            var cloned = JSON.parse(JSON.stringify(change.doc))
            doc = accounts_api.parseDoc(cloned)
          }
          api.account.emit('change', doc)
          if (doc && doc.type) {
            api.account.emit(doc.type + ':change', doc)
          }
        })
        return api
      }

      manager.stop = function (callback) {
        process.nextTick(
          async.parallel.bind(null, [
            cm.stop,
            am.stop,
            tm.stop,
            em.stop
          ], callback)
        )
      }

      callback(null, manager)
    })
}

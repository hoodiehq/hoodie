var events = require('events')
var url = require('url')

var async = require('async')
var follow = require('follow')
var request = require('request').defaults({json: true})

exports.start = function (manager, callback) {
  var cm = {}

  var ev = new events.EventEmitter()

  cm.on = function () {
    return ev.on.apply(ev, arguments)
  }
  cm.emit = function () {
    return ev.emit.apply(ev, arguments)
  }

  var app_config = {}
  var plugin_configs = {}

  cm.getAppConfig = function () {
    return app_config || {}
  }

  cm.getPluginConfig = function (name) {
    return plugin_configs[name] || {}
  }

  var app_db = manager._resolve('/app/')
  var plugins_db = manager._resolve('/plugins/')

  async.parallel({
    app: async.apply(exports.appConfig, app_db),
    plugins: async.apply(exports.allPluginDocs, plugins_db)
  }, function (err, results) {
    if (err) {
      return callback(err)
    }

    app_config = results.app.config
    plugin_configs = exports.combinePluginConfigDocs(results.plugins)

    var app_feed = follow({
      db: app_db,
      since: 'now'
    })
    app_feed.on('change', function (change) {
      if (change.id === 'config') {
        exports.appConfig(app_db, function (err, doc) {
          if (err) {
            return console.error('Error updating app config: ' + err)
          }

          app_config = doc.config
          cm.emit('appcfg', app_config)
        })
      }
    })

    var plugin_feed = follow({
      db: plugins_db,
      since: 'now',
      include_docs: true
    })
    plugin_feed.on('change', function (change) {
      var doc = change.doc
      if (exports.isPluginDoc(doc)) {
        var name = exports.pluginName(doc)
        plugin_configs[name] = doc.config
        cm.emit('plugincfg', name, doc.config)
      }
    })

    cm.stop = function (callback) {
      app_feed.once('error', function (err) {
        // ignore connection errors during stopping of feed
        if (err.code !== 'ECONNREFUSED' &&
          err.code !== 'ECONNRESET') {
          throw err
        }
      })

      plugin_feed.once('error', function (err) {
        // ignore connection errors during stopping of feed
        if (err.code !== 'ECONNREFUSED' &&
          err.code !== 'ECONNRESET') {
          throw err
        }
      })

      app_feed.once('stop', function () {
        plugin_feed.once('stop', callback)
        plugin_feed.stop()
      })

      app_feed.stop()
    }

    callback(null, cm)
  })
}

exports.combinePluginConfigDocs = function (docs) {
  return docs.reduce(function (acc, doc) {
    acc[exports.pluginName(doc)] = doc.config
    return acc
  }, {})
}

exports.appConfig = function (app_db_url, callback) {
  request.get(url.resolve(app_db_url, 'config'), function (err, response, body) {
    return callback(err, body)
  })
}

exports.pluginName = function (cfg_doc) {
  return cfg_doc._id.replace(/^plugin\//, '')
}

exports.isPluginDoc = function (doc) {
  return (/^plugin\//).test(doc._id)
}

exports.allPluginDocs = function (plugin_db_url, callback) {
  var all_docs = url.resolve(plugin_db_url, '_all_docs')

  request.get({
    url: all_docs,
    qs: {include_docs: true}
  }, function (err, response, data) {
    if (err) {
      return callback(err)
    }

    var docs = data.rows.map(function (r) {
      return r.doc
    })

    var plugin_docs = docs.filter(exports.isPluginDoc)
    return callback(null, plugin_docs)
  })
}

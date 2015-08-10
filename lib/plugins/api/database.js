/**
 * Dependencies
 */

var url = require('url')

var _ = require('lodash')

/**
 * API for iteracting with a single CouchDB database
 */

exports.DatabaseAPI = function DatabaseAPI (hoodie, options) {
  /**
   * Methods are pre-bound to the db object to make composition
   * of async calls easier - this is more likely to be an issue
   * than pre-binding the top-level Hoodie object, but "It's a
   * problem when it's a problem"
   */

  var db = this

  /**
   * The CouchDB path to the database
   */

  var db_url = '/' + encodeURIComponent(options.name) + '/'

  /**
   * Resolves a path relative to the database URL
   */

  db._resolve = function (path) {
    return url.resolve(db_url, path)
  }

  /**
   * Adds a new document to the database
   */

  db.add = function (type, attrs, callback) {
    attrs.type = type

    // we can't prepare a couch `id` without a `doc.id`, so
    // let's check whether it exists first...
    if (!attrs.id) {
      return callback(new Error('Hoodie objects must have an `id` property'))
    }

    var doc = options.prepare(attrs)
    var url = db._resolve(encodeURIComponent(doc._id))
    doc.createdAt = new Date()
    hoodie.request('PUT', url, {data: doc}, callback)
  }

  /**
   * Gets a specific document from the database
   */

  db.find = function (type, id, callback) {
    var _id = options._id(type, id)
    var url = db._resolve(encodeURIComponent(_id))
    hoodie.request('GET', url, {}, function (err, doc) {
      return callback(err, err ? null : options.parse(doc))
    })
  }

  /**
   * Update an existing document
   */

  db.update = function (type, id, attrs, callback) {
    db.find(type, id, function (err, data) {
      if (err) {
        return callback(err)
      }
      var data2 = _.extend(data, attrs)
      return db.add(type, data2, callback)
    })
  }

  /**
   * Find all documents (optionally matching a single type)
   */

  db.findAll = function (/* optional */ type, callback) {
    if (!callback) {
      callback = type
      type = null
    }
    var url = db._resolve('_all_docs')
    var opt = {data: {include_docs: true}}
    if (type) {
      opt.data.start_key = JSON.stringify(type + '/')
      opt.data.end_key = JSON.stringify(type + '0')
    }
    hoodie.request('GET', url, opt, function (err, body) {
      if (err) {
        return callback(err)
      }
      var docs = body.rows.filter(function (r) {
        // filter out design docs
        return r.id[0] !== '_'
      })
      docs = docs.map(function (r) {
        return options.parse(r.doc)
      })
      return callback(null, docs)
    })
  }

  /**
   * Remove a specific document from the database
   */

  db.remove = function (type, id, callback) {
    db.find(type, id, function (err, data) {
      if (err) {
        return callback(err)
      }
      var _id = options._id(type, id)
      var url = db._resolve(encodeURIComponent(_id))
      data._deleted = true
      hoodie.request('PUT', url, {data: data}, callback)
    })
  }

  /**
   * Remove all documents matching a type
   */

  db.removeAll = function (type, callback) {
    var docs

    db.findAll(type, function (err, data) {
      if (err) {
        return callback(err)
      }
      docs = data.map(function (d) {
        d._deleted = true
        return options.prepare(d)
      })
      var url = db._resolve('_bulk_docs')
      var opt = {data: {docs: docs}}
      hoodie.request('POST', url, opt, callback)
    })
  }

  if (options.editable_permissions) {
    var write = 'hoodie:write:' + options.name
    var read = 'hoodie:read:' + options.name

    db.grantWriteAccess = function (type, id, callback) {
      return hoodie.account._addRoles(type, id, [write, read], callback)
    }

    db.revokeWriteAccess = function (type, id, callback) {
      return hoodie.account._removeRoles(type, id, [write], callback)
    }

    db.grantReadAccess = function (type, id, callback) {
      return hoodie.account._addRoles(type, id, [read], callback)
    }

    db.revokeReadAccess = function (type, id, callback) {
      return hoodie.account._removeRoles(type, id, [write, read], callback)
    }

    db.grantPublicReadAccess = function (callback) {
      var sec_url = db._resolve('_security')
      var sec = {
        admins: {
          names: [],
          roles: []
        },
        members: {
          names: [],
          roles: []
        }
      }
      hoodie.request('PUT', sec_url, {data: sec}, callback)
    }

    db.revokePublicReadAccess = function (callback) {
      db.revokePublicWriteAccess(function (err) {
        if (err) {
          return callback(err)
        }
        var sec_url = db._resolve('_security')
        var sec = {
          admins: {
            names: [],
            roles: []
          },
          members: {
            names: [],
            roles: [
              'hoodie:read:' + options.name,
              'hoodie:write:' + options.name
            ]
          }
        }
        hoodie.request('PUT', sec_url, {data: sec}, callback)
      })
    }

    db.grantPublicWriteAccess = function (callback) {
      db.grantPublicReadAccess(function (err, body, res) {
        if (err) {
          return callback(err, body, res)
        }
        var ddoc_url = db._resolve('_design/permissions')
        hoodie.request('GET', ddoc_url, {}, function (err, body, res) {
          if (res.statusCode === 404) {
            // already doesn't exist, no need to delete
            return callback()
          } else if (err) {
            // an error occurred (that wasn't a 404)
            return callback(err, body, res)
          } else {
            // delete permissions doc
            var opt = {data: {rev: body._rev}}
            hoodie.request('DELETE', ddoc_url, opt, callback)
          }
        })
      })
    }

    db.revokePublicWriteAccess = function (callback) {
      var db_url = '/' + encodeURIComponent(options.name)
      var ddoc_url = db_url + '/_design/permissions'
      var role_str = JSON.stringify(write)
      var ddoc = {
        _id: '_design/permissions',
        language: 'javascript',
        // args: newDoc, oldDoc, userCtx, security
        validate_doc_update: 'function (newDoc, oldDoc, userCtx) {\n' +
          'for (var i = 0; i < userCtx.roles.length; i++) {\n' +
          'var r = userCtx.roles[i];\n' +
          'if (r === ' + role_str + ' || r === "_admin") {\n' +
          'return;\n' +
          '}\n' +
          '}\n' +
          'throw {unauthorized: "You are not authorized to write ' +
          'to this database"};\n' +
          '}'
      }
      // handle existing ddoc
      hoodie.request('GET', ddoc_url, {}, function (err, doc, res) {
        if (res.statusCode === 404) {
          // does not exist, create it
          hoodie.request('PUT', ddoc_url, {data: ddoc}, callback)
        } else if (err) {
          // an error occurred
          return callback(err)
        } else {
          // existing doc, make sure it has the right validate_doc_update
          ddoc = _.extend(doc, ddoc)
          hoodie.request('PUT', ddoc_url, {data: ddoc}, callback)
        }
      })
    }

    db.addPermission = function (name, f, callback) {
      var fstr = f.toString()
      var db_url = '/' + encodeURIComponent(options.name)
      var ddoc_url = db_url + '/_design/permission_' +
        encodeURIComponent(name)

      // handle existing ddoc
      hoodie.request('GET', ddoc_url, {}, function (err, doc, res) {
        var ddoc
        if (res.statusCode === 404) {
          ddoc = {validate_doc_update: fstr}
        } else if (err) {
          return callback(err)
        } else {
          ddoc = doc
          doc.validate_doc_update = fstr
        }
        hoodie.request('PUT', ddoc_url, {data: ddoc}, callback)
      })
    }

    db.removePermission = function (name, callback) {
      var db_url = '/' + encodeURIComponent(options.name)
      var ddoc_url = db_url + '/_design/permission_' +
        encodeURIComponent(name)

      // handle existing ddoc
      hoodie.request('GET', ddoc_url, {}, function (err, doc, res) {
        if (res.statusCode === 404) {
          // does not exist
          return callback()
        } else if (err) {
          return callback(err)
        }
        doc._deleted = true
        hoodie.request('PUT', ddoc_url, {data: doc}, callback)
      })
    }
  }

  /**
   * CouchDB views created using `db.addIndex()` are all stored in the same
   * design document: `_design/views`.
   * See https://github.com/hoodiehq/hoodie.js/issues/70#issuecomment-20506841
   */

  var views_ddoc_id = '_design/views'
  var views_ddoc_url = db._resolve(views_ddoc_id)

  /**
   * Creates new design doc with CouchDB view on db
   */

  db.addIndex = function (name, mapReduce, callback) {
    if (!mapReduce || !_.isFunction(mapReduce.map)) {
      return callback(new Error('db.addIndex() expects mapReduce ' +
        'object to contain a map function.'))
    }

    hoodie.request('GET', views_ddoc_url, {}, function (err, ddoc, res) {
      if (res.statusCode === 404) {
        // not found, so we use new object.
        ddoc = {
          language: 'javascript',
          views: {}
        }
      } else if (err) {
        return callback(err)
      }

      // View functions need to be serialised/stringified.
      var serialised = _.reduce(mapReduce, function (memo, v, k) {
        memo[k] = _.isFunction(v) ? v.toString() : v
        return memo
      }, {})

      // If view code has not changed we don't need to do anything else.
      // NOTE: Not sure if this is the best way to deal with this. This
      // saves work and avoids unnecessarily overwriting the
      // `_design/views` document when no actual changes have been made to
      // the view code (map/reduce).
      if (_.isEqual(serialised, ddoc.views[name])) {
        return callback(null, {
          ok: true,
          id: ddoc._id,
          rev: ddoc._rev
        })
      }

      ddoc.views[name] = serialised
      hoodie.request('PUT', views_ddoc_url, {data: ddoc}, callback)
    })
  }

  /**
   * Removes couchdb view from db
   */

  db.removeIndex = function (name, callback) {
    hoodie.request('GET', views_ddoc_url, {}, function (err, ddoc) {
      if (err) {
        return callback(err)
      }

      if (ddoc.views && ddoc.views[name]) {
        delete ddoc.views[name]
      }

      hoodie.request('PUT', views_ddoc_url, {data: ddoc}, callback)
    })
  }

  /**
   * Query a couchdb view on db
   *
   * Arguments:
   *
   * * `index` is the name of the view we want to query.
   *
   * * `params` is an object with view query parameters to be passed on when
   * sending request to CouchDB. There is a special `params.parse` property
   * that is not passed to CouchDB but used to know whether we should parse
   * the values in the results as proper documents (translating couchdb's
   * `_id` to hoodie's `id` and so on). If your view's map function emits
   * whole documents as values you will probably want to use `params.parse` so
   * that you get a nice array of docs as you would with `db.findAll()`.
   */

  db.query = function (index, params, callback) {
    // `params` is optional, when only two args passed second is callback.
    if (arguments.length === 2) {
      callback = params
      params = null
    }

    var view_url = db._resolve('_design/views/_view/' + index)

    // If params have been passed we build the query string.
    if (params) {
      var qs = _.reduce(params, function (memo, v, k) {
        if (k === 'parse') return memo

        if (memo) {
          memo += '&'
        }

        return memo + k + '=' + encodeURIComponent(JSON.stringify(v))
      }, '')
      if (qs) {
        view_url += '?' + qs
      }
    }

    hoodie.request('GET', view_url, function (err, data) {
      if (err) {
        return callback(err)
      }
      var results = data.rows
      // If `params.parse` was set we need to parse the value in each row
      // as a proper document.
      if (params && params.parse) {
        results = data.rows.map(function (r) {
          return options.parse(r.value)
        })
      }
      callback(null, results, _.omit(data, [ 'rows' ]))
    })
  }

  return db
}

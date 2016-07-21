module.exports = parseOptions

var log = require('npmlog')

/**
 * Parse options into internal config structure.
 *
 * Options are all the things that users can pass in to Hoodie as described at
 * https://github.com/hoodiehq/hoodie#usage. All these options are flat, while
 * internally we group theem into db, connection and path options.
 *
 * `appOptions` are app-specific default options configured in the
 * app’s package.json (on the `"hoodie"` key).
 *
 * The parsing of the database configuration is a bit more complex. If `dbUrl`
 * is passed it means that a remote CouchDB is used for persistance, otherwise
 * PouchDB is being used. A shortcut to set PouchDB’s adapter to memdown is to
 * passe set the `inMemory: true` option. If it’s not set, leveldown is used
 * with the prefix set to `options.data` + 'data' (`.hoodie/data` by default).
 */
function parseOptions (options) {
  var config = {
    loglevel: options.loglevel,
    paths: {
      data: options.data,
      public: options.public
    },
    db: {}
  }

  log.level = config.loglevel

  if (options.url) {
    config.url = options.url
  }

  if (options.dbUrl) {
    config.db.url = options.dbUrl
  }
  if (options.inMemory) {
    config.inMemory = true
  }

  return config
}

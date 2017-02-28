module.exports = parseOptions

var log = require('npmlog')
var path = require('path')
var PouchDB = require('pouchdb-core')

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
 *
 * @function createAuthDbUrl accepts options.dbUrlUsername, options.dbUrlPassword, options.dbUrl, @returns encoded dbUrl
 */

function parseOptions (options) {
  /**
   * Parse username, password and url for external db, via options object and returns the modified dbUrl
   * with username and password encoded in URL encoding
   *
   * @param dbUsername used for parsing options.dbUrlUsername
   * @param dbPassword used for parsing options.dbUrlPassword
   * @param dbUrl used for parsing options.dbUrl
   *
   * @var dbUrlParts contains different parts of dbUrl, helping in modifing username and password
   *
   * @returns dbUrl based on the parameters
   * @throws Error if dbUrl is unparsable or authDetails are missing
   */
  function createAuthDbUrl (dbUsername, dbPassword, dbUrl) {
    let dbUrlParts = {
      prefix: '',
      authDetails: '',
      url: ''
    }

    if (dbUrl) {
      dbUrlParts.prefix = dbUrl.startsWith('https://') ? (
        dbUrl = dbUrl.replace('https://', ''),
        'https://'
      ) : (
        dbUrl = dbUrl.replace('http://', ''),
        'http://'
      )

      if (dbUrl.includes('@')) {
        dbUrlParts.authDetails = dbUrl.split('@').slice(0, -1).join('@')
        dbUrlParts.url = dbUrl.replace(dbUrlParts.authDetails + '@', '')

        if (!dbUrlParts.authDetails) throw new Error('dbUrl: ' + '"' + dbUrlParts.prefix + dbUrl + '"' + ' does not include authentication details')

        if (dbUrlParts.authDetails.includes(':')) {
          if (dbUrlParts.authDetails.match(/:/gi).length >= 2) throw new Error('Could not find username & password in dbUrl. Please try setting --dbUrlUsername and --dbUrlPassword if either contains special characters like : or @')

          if (!dbUrlParts.authDetails.split(':')[1]) {
            throw new Error('Password is missing from --dbUrl after symbol ":"')
          }

          if (dbUsername && dbPassword) {
            log.warn('DB config', '--dbUsername and --dbPassword are replacing authentication details of --dbUrl')

            return dbUrlParts.prefix + encodeURIComponent(dbUsername) + ':' + encodeURIComponent(dbPassword) + '@' + dbUrlParts.url
          } else if (dbUsername) {
            log.warn('DB config', '--dbUsername are replacing authentication details of --dbUrl')
            return dbUrlParts.prefix + encodeURIComponent(dbUrlParts.authDetails.split(':')[0]) + ':' + encodeURIComponent(dbPassword) + '@' + dbUrlParts.url
          } else if (dbPassword) {
            log.warn('DB config', '--dbPassword are replacing authentication details of --dbUrl')
            return dbUrlParts.prefix + encodeURIComponent(dbUsername) + ':' + encodeURIComponent(dbUrlParts.authDetails.split(':')[1]) + '@' + dbUrlParts.url
          }

          return dbUrlParts.prefix + (dbUrlParts.authDetails.split(':').map(n => encodeURIComponent(n)).join(':')) + '@' + dbUrlParts.url
        }

        if (dbPassword) {
          return dbUrlParts.prefix + encodeURIComponent(dbUrlParts.authDetails) + ':' + encodeURIComponent(dbPassword) + '@' + dbUrlParts.url
        } else {
          throw new Error('Password has not been specified for dbUrl: ' + dbUrlParts.prefix + dbUrl + '. ' +
            'Use --dbUrlPassword or provide it within --dbUrl.')
        }
      } else {
        if (!(dbUsername && dbPassword)) {
          throw new Error('Authentication credentials (username AND password) are missing from dbUrl. Provide them either by --dbUrl directly or by setting --dbUrlUsername and --dbUrlPassword arguments.')
        }
        return dbUrlParts.prefix + encodeURIComponent(dbUsername) + ':' + encodeURIComponent(dbPassword) + '@' + dbUrl
      }
    } else {
      if (dbUsername || dbPassword) {
        log.warn('DB url config', 'No dbAddress is provided in order to authenticate with credentials(username:password): ' + dbUsername + ':' + dbPassword)
        log.warn('DB config', 'Setting db automatically depending on --inMemory. To see more, use --loglevel=info')
      }
      return undefined
    }
  }

  var dbOptions = {}

  var config = {
    loglevel: options.loglevel,
    paths: {
      data: options.data,
      public: options.public
    },
    inMemory: Boolean(options.inMemory)
  }

  log.level = config.loglevel

  if (options.url) {
    config.url = options.url
  }

  if (options.adminPassword) {
    config.adminPassword = options.adminPassword
  }

  PouchDB.plugin(require('pouchdb-mapreduce'))

  options.dbUrl = createAuthDbUrl(options.dbUrlUsername, options.dbUrlPassword, options.dbUrl)

  if (options.dbUrl) {
    PouchDB.plugin(require('pouchdb-adapter-http'))
    dbOptions.prefix = options.dbUrl
    log.info('config', 'Storing all data in ' + options.dbUrl)
  } else if (options.inMemory) {
    PouchDB.plugin(require('pouchdb-adapter-memory'))
    config.inMemory = true
    log.info('config', 'Storing all data in memory only')
  } else {
    PouchDB.plugin(require(options.dbAdapter))
    dbOptions.prefix = path.join(config.paths.data, 'data') + path.sep
    log.info('config', 'Storing all data in ' + dbOptions.prefix + ' using ' + options.dbAdapter)
  }
  config.PouchDB = PouchDB.defaults(dbOptions)

  return config
}

module.exports = createAuthDbUrl

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
 *
 */

function createAuthDbUrl (log, dbUsername, dbPassword, dbUrl) {
  var dbUrlParts = {
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

        if (!dbUrlParts.authDetails.split(':')[0]) {
          throw new Error('Username is missing from --dbUrl after symbol ":"')
        }

        if (dbUsername || dbPassword) {
          log.warn('DB config', '--dbUsername and --dbPassword are replacing authentication details of --dbUrl')

          return dbUrlParts.prefix + (dbUsername ? encodeURIComponent(dbUsername) : encodeURIComponent(dbUrlParts.authDetails.split(':')[0])) + ':' + (dbPassword ? encodeURIComponent(dbPassword) : encodeURIComponent(dbUrlParts.authDetails.split(':')[1])) + '@' + dbUrlParts.url
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

module.exports = getDefaults

var path = require('path')

function getDefaults () {
  var projectPath = process.cwd()

  return {
    loglevel: 'warn',
    paths: {
      data: path.join(projectPath, '.hoodie'),
      public: path.join(projectPath, 'public')
    },
    connection: {
      host: '127.0.0.1',
      port: 8080,
      routes: {
        cors: {
          credentials: true
        }
      }
    },
    db: {},

    // core modules
    account: {},
    admin: {},
    client: {},
    store: {},

    // plugins
    plugins: {}
  }
}

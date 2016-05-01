module.exports = getDefaults

var path = require('path')

function getDefaults () {
  var projectPath = process.cwd()
  var pkg = require(path.join(projectPath, 'package.json'))

  return {
    name: pkg.name,
    paths: {
      data: path.join(projectPath, '.hoodie'),
      public: path.join(projectPath, 'public')
    },
    app: {
      hostname: '127.0.0.1',
      port: 8080,
      protocol: 'http'
    },
    db: {},
    account: {},
    admin: {}
  }
}

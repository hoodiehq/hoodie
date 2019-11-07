#!/usr/bin/env node

var path = require('path')
var fs = require('fs')
var log = require('npmlog')

var isInstallIntoApp = /node_modules/.test(process.cwd())

// This block only executes if Hoodie is installed with as a dependency
if (isInstallIntoApp) {
  var pathToAppRoot = path.resolve('..', '..')
  var packageJson = require(path.join(pathToAppRoot, 'package.json'))

  packageJson.scripts = packageJson.scripts || {}

  if (packageJson.scripts.start) {
    if (!(packageJson.scripts.start.startsWith('hoodie'))) {
      log.info('setup', 'start script already set to "' + packageJson.scripts.start +
      ', you can start hoodie with "npm run start-hoodie" instead')
      packageJson.scripts['start-hoodie'] = 'hoodie'
    }
  } else {
    packageJson.scripts.start = 'hoodie'
  }

  var newPackageJson = JSON.stringify(packageJson, null, 2)

  fs.writeFile(path.join(pathToAppRoot, 'package.json'), newPackageJson,
    function (error) {
      if (error) {
        log.error('setup', 'Could not create package.json at ' + path.join(pathToAppRoot, 'package.json'))
        log.error(error)
        return
      }
      log.info('setup', 'Start your Hoodie app with "npm start"')
    })

  // Create README.md if one is not found.
  // - https://nodejs.org/api/fs.html#fs_fs_access_path_mode_callback
  var readmePath = path.join(pathToAppRoot, 'README.md')
  fs.open(readmePath, 'wx',
    function (error, fd) {
      if (error) {
        if (error.code === 'EEXIST') {
          log.verbose('setup', 'README.md already exists')
          return
        } else {
          log.error('setup', 'Something went wrong when opening README.md at ' + pathToAppRoot)
          log.error(error)
          return
        }
      }

      // - https://nodejs.org/api/path.html#path_path_parse_path
      var base = path.parse(pathToAppRoot).base
      var readMeContents = '# ' + base + '\n' + 'Created with [hoodie](https://github.com/hoodiehq)'
      fs.writeFile(readmePath, readMeContents,
        function (error) {
          if (error) {
            log.error('setup', 'Could not create README.md at ' + pathToAppRoot)
            log.error(error)
            return
          }
          log.info('setup', 'README.md created')
        })
    })
}

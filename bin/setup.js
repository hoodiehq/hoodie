#!/usr/bin/env node

var path = require('path')
var fs = require('fs')
var log = require('npmlog')

// use process.env to access npm config environment variables.
// - https://docs.npmjs.com/misc/config#environment-variables
// - https://docs.npmjs.com/misc/config#save
var saveRequested = process.env.npm_config_save

// This block only executes if Hoodie is installed with `-S` or `--save` flags.
if (saveRequested) {
  var pathToAppRoot = path.resolve('..', '..')
  var packageJson = require(path.join(pathToAppRoot, 'package.json'))

  packageJson.scripts = packageJson.scripts || {}
  packageJson.scripts[ 'start' ] = 'hoodie'

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

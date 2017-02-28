#!/usr/bin/env node

var log = require('npmlog')
log.level = 'warn'

var cli = require('../cli')

var emoji = require('node-emoji')

cli(function (error, server) {
  if (error) {
    log.warn('DB url config', 'If you are using --dbUrl, --dbUrlUsername, --dbUrlPassword, you should provide your authentication details without URL encoding')
    throw error
  }

  console.log((process.platform === 'darwin' ? emoji.get('dog') + '  ' : '') + 'Your Hoodie app has started on:', server.info.uri)
  console.log('Stop server with control + c')
})

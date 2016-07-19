#!/usr/bin/env node

var cli = require('../cli')

var emoji = require('node-emoji')

cli(function (error, server) {
  if (error) {
    throw error
  }

  console.log((process.platform === 'darwin' ? emoji.get('dog') + '  ' : '') + 'Your Hoodie app has started on:', server.info.uri)
  console.log('Stop server with control + c')
})

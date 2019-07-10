var spawn = require('child_process').spawn
var os = require('os')
var start

function onLog (data) {
  console.log(data.toString())
}

function onError (data) {
  console.error(data.toString())
}

if (os.type() === 'Linux') {
  start = spawn('./bin/start.js')
} else if (os.type() === 'Windows_NT') {
  start = spawn('node', ['bin\\start.js'])
}

start.stdout.on('data', onLog)
start.stderr.on('data', onError)

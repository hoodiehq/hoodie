const spawn = require('child_process').spawn
const os = require('os')
const start

function onLog (data) {
  console.log(data.toString())
}

function onError (data) {
  console.error(data.toString())
}

if (os.type() === 'Windows_NT') {
  start = spawn('node', ['bin\\start.js'])
} else {
  start = spawn('./bin/start.js')
}

start.stdout.on('data', onLog)
start.stderr.on('data', onError)

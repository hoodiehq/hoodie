var exec = require('child_process').exec
var tap = require('tap')
var test = tap.test

test('cleanup', function (t) {
  if (process.env.CI) return t.end()
  exec('couchdb -d -o ./data/couch.out -e ./data/couch.err -p ./data/couch.pid', function (error, stdout, stderr) {
    t.error(error)
    t.end()
  })
})

var exec = require('child_process').exec

var async = require('async')
var mkdirp = require('mkdirp')
var request = require('request')
var rimraf = require('rimraf')
var test = require('tap').test

var OPTS = require('./lib/default-options')

test('couchdb', function (t) {
  if (process.env.CI) return t.end()
  async.series([
    async.apply(exec, 'cat data/couch.pid | xargs kill'),
    async.apply(rimraf, './data'),
    async.apply(mkdirp, './data'),
    async.apply(exec, 'couchdb -b -a ./test/integration/plugins/manager/fixtures/couch.ini -o ./data/couch.out -e ./data/couch.err -p ./data/couch.pid && sleep 1')
  ],
  function (error, results) {
    t.error(error)
    t.end()
  })
})

test('database', function (t) {
  var appconfig = {
    config: {
      foo: 'bar',
      email_host: 'emailhost',
      email_port: 465,
      email_user: 'gmail.user@gmail.com',
      email_pass: 'userpass',
      email_secure: true,
      email_service: 'Gmail'
    }
  }
  async.series([
    async.apply(request.put, OPTS.couchdb.url + '/_config/admins/' + OPTS.couchdb.user, {body: JSON.stringify(OPTS.couchdb.pass)}),
    async.apply(request.put, OPTS.base_url + '/plugins'),
    async.apply(request.put, OPTS.base_url + '/app'),
    async.apply(request.put, OPTS.base_url + '/app/config', {body: JSON.stringify(appconfig)})
  ],
  function (error, results) {
    t.error(error)
    t.end()
  })
})

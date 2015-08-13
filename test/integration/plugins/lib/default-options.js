var url = require('url')

var OPTS = {
  name: 'myplugin',
  couchdb: {
    user: 'admin',
    pass: 'password',
    url: 'http://localhost:5985/'
  },
  config: {
    app: {foo: 'bar'},
    plugin: {}
  }
}

var base = url.parse(OPTS.couchdb.url)
base.auth = OPTS.couchdb.user + ':' + OPTS.couchdb.pass
base = url.format(base)

OPTS.base_url = base

module.exports = OPTS

var OPTS = {
  name: 'myplugin',
  couch_url: 'http://admin:password@localhost:5985/',
  config: {
    app: {foo: 'bar'},
    plugin: {}
  }
}

OPTS.base_url = OPTS.couch_url

module.exports = OPTS

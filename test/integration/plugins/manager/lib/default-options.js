var OPTS = {
  couchdb: {
    user: 'admin',
    pass: 'password',
    url: 'http://localhost:5984'
  }
}

OPTS.base_url = OPTS.couchdb.url.replace('http://', 'http://' + OPTS.couchdb.user + ':' + OPTS.couchdb.pass + '@')

module.exports = OPTS

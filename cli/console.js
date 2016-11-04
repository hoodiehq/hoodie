var repl = require('repl')
var PouchDB = require('pouchdb-core')

var AccountApi = require('@hoodie/account-server/api')

var Loader = require('./loader') //what did I need the loader for?
var getOptions = require('./options.js')

var projectPath = process.cwd()
var options = getOptions(projectPath)

//BEGINNING OF COPY/PASTE FROM https://github.com/hoodiehq/hoodie/blob/be9e92fa700cc028d3c4c469f595963cfa4f1bca/server/index.js#L23-L61
// mapreduce is required for `db.query()`
PouchDB.plugin(require('pouchdb-mapreduce'))

if (!options.db.url) {
  if (options.inMemory) {
    PouchDB.plugin(require('pouchdb-adapter-memory'))
    log.info('config', 'Storing all data in memory only')
  } else {
    PouchDB.plugin(require('pouchdb-adapter-leveldb'))

    // this is a temporary workaround until we replace options.db with options.PouchDB:
    // https://github.com/hoodiehq/hoodie/issues/555
    if (!options.paths) {
      options.paths = {
        data: '.hoodie',
        public: 'public'
      }
    }
    if (!options.paths.data) {
      options.paths.data = '.hoodie'
    }

    options.db.prefix = path.join(options.paths.data, 'data' + path.sep)
    log.info('config', 'No CouchDB URL provided, falling back to PouchDB')
    log.info('config', 'Writing PouchDB database files to ' + options.db.prefix)
  }
}

if (options.db.url) {
  if (!urlParse(options.db.url).auth) {
    return next(new Error('Authentication details missing from database URL: ' + options.db.url))
  }

  PouchDB.plugin(require('pouchdb-adapter-http'))
  options.db.prefix = options.db.url
  delete options.db.url
}

options.PouchDB = PouchDB.defaults(options.db)
  //END OF COPY PASTE

var api = new AccountApi({
  PouchDB: new PouchDB(options), // am I supposed to instantiate a new instance here?
  usersDb: '_users',
  secret: 'secret'
})

console.log(`
  Hello ${process.env.USER}! I am the hoodie console! 🐶

  hoodie console is an app specific node REPL that gives
  you access to the account server API, including session and account methods.

  Happy hacking!
`);

var replServer = repl.start({
  prompt: 'hoodie> ',
});

replServer.context.options = options;
replServer.context.api = api;
//FIXME: api methods require a state argument

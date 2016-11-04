var repl = require('repl')
var PouchDB = require('pouchdb-core')

var AccountApi = require('@hoodie/account-server/api')

var Loader = require('./loader') //what did I need the loader for?
var getOptions = require('./options.js')

var projectPath = process.cwd()
var options = getOptions(projectPath)

var api = new AccountApi({
  PouchDB: PouchDB,
  usersDb: '_users',
  secret: 'secret'
})

console.log(`
  Hello ${process.env.USER}! I am the hoodie console! 🐶

  hoodie REPL is an application specific node REPL that gives
  you access to the account server API, including session and account methods.

  Happy hacking!
`);

var replServer = repl.start({
  prompt: 'hoodie> ',
});

replServer.context.options = options;
replServer.context.api = api;


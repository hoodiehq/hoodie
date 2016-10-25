var repl = require('repl')

var AccountAdmin = require('@hoodie/account-client/admin')
var Loader = require('./loader')
var getCliOptions = require('./options.js');

var options = getCliOptions(/*how to get the proct path???*/)

// create new instance of Account Admin
var admin = AccountAdmin(options)

console.log(`
  Hello ${process.env.USER}! I am hoodie admin account REPL! 🐶

  hoodie REPL is an application specific REPL for hoodie development that gives
  you access to the Account Admin Methods.

  Happy hacking!
`);

var replServer = repl.start({
  prompt: 'hoodie> ',
});

replServer.context.admin = admin;


var repl = require('repl')
var fs = require('fs')

var HoodieAdmin = require('./index.js')
var loader = require('./loader')

console.log(`
  Hello ${process.env.USER}! I am hoodie admin account REPL! 🐶

  hoodie REPL is an application specific REPL for hoodie development that gives
  you access to the Account Admin Methods.

  Happy hacking!
`);

var admin = HoodieAdmin();

var replServer = repl.start({
  prompt: 'hoodie> ',
});

replServer.context.admin = admin;


var repl = require('repl');
var fs = require('fs');

var getHoodieDefaults = require('./hoodie-defaults');
var compatibilityCheck = require('./compatibility-check.js');
var getHapiOptions = require('./hapi-options.js');
var getCliOptions = require('./options.js');
var parseOptions = require('./parse-options.js');

console.log(`
  Hello ${process.env.USER}! I am hoodie REPL! 🐶

  hoodie REPL is an application specific CLI for hoodie development.
  To access the help menu, just run the node command help()
  This REPL give you access to admin actions, variables.
  Happy hacking!
`);

var replServer = repl.start({
  prompt: 'hoodie> ',
});

replServer.context.getHoodieDefaults = getHoodieDefaults;
replServer.context.compatibilityCheck = compatibilityCheck;
replServer.context.getCliOptions = getCliOptions;
replServer.context.parseOptions = parseOptions;

replServer.context.help = function() {
  console.log('how can I help you?');
}


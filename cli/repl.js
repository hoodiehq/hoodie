var repl = require('repl');
var fs = require('fs');

console.log(`Hello world! I am hoodie REPL! 🐶`);

// print out doggie- may take out for the final
fs.readFile('./cli/hoodie.txt', (err, hoodie) => console.log(hoodie.toString()));
//TODO: console.log all the possible commands you can do.

var replServer = repl.start({
  eval: function(){console.log('hello world I am hoodie!')},
  prompt: 'hoodie >',
});

replServer.on('start', function() {
  console.log('hello world I am hoodie!');
  var hoodie = fs.readFileSync('./hoodie.txt');
  console.log(hoodie);
})

//customize context
// replServer.context = 'foo';

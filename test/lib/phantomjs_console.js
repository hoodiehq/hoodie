var command_file, fs, page, url;

fs = require('fs');

command_file = "/tmp/phantom_command.js";

fs.touch(command_file);

url = phantom.args[0];

if (!url) {
  console.log("\nUSAGE:");
  console.log("phantomjs path/to/file.html\n");
  phantom.exit();
}

page = new WebPage();

page.onConsoleMessage = function(msg, line, file) {
  return console.log(msg);
};

page.onError = function(msg, trace) {
  return console.log(msg);
};

page.open(phantom.args[0], function(status) {
  var execCommand, readCommand;
  readCommand = function() {
    var command;
    command = fs.read(command_file);
    fs.write(command_file, '');
    if (command) {
      command = command.replace(/^.*\n/, '');
      command = command.replace(/(^\s+|\s+$)/g, '');
      console.log(" > " + command);
      return page.evaluate(execCommand, command);
    }
  };
  execCommand = function(command) {
    var ret;
    ret = eval(command);
    if (!/console\.log/.test(command)) {
      return console.log("->", ret != null ? ret.toString().replace(/\n/g, "\n   ") : void 0);
    }
  };
  if (status !== 'success') {
    console.log(status + '! Unable to access ' + phantom.args[0]);
    return phantom.exit();
  } else {
    console.log("");
    console.log("Exit with ^ + C");
    console.log("");
    return setInterval(readCommand, 100);
  }
});


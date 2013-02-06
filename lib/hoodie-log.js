var npm = require("npm");
var util = require("util");
var request = require("request");

module.exports = function HoodieLog(name, couch_url) {
  var password;
  npm.load(function(error, npm) {
    password = npm.config.get(name + "_admin_pass");
  });

  return function hoodie_log() {
    // log as usual
    console.log.apply(this, arguments);

    // make a nice object!
    var log = {
      message: util.format.apply(this, arguments),
      time: new Date()
    };

    // send to couch
    request({
      url: couch_url + "/logs",
      method: "POST",
      auth: "admin:" + password,
      json: log
    }, function(error) {
      if(error) {
        throw error;
      }
    });
  };
};

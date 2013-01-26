var npm = require("npm");
var util = require("util");
var request = require("request");
var EventEmitter = require("events").EventEmitter;

module.exports = HoodieInstaller;
util.inherits(HoodieInstaller, EventEmitter);

function HoodieInstaller(name, couch_url) {

  EventEmitter.call(this);

  var couch_has_admin = function couch_has_admin(cb) {
    // let’s request /_users
    // if we get a 401, there is an admin
    request(couch_url + "/_users/_all_docs", function(error, response) {
      if(error !== null) {
        console.trace("couch_has_admin");
        console.log(couch_url + "/_users");
        console.log(error);
        throw error;
      }
      cb((response.statusCode == 403));
    });
  }

  var that = this;
  couch_has_admin(function(result) {
    if(result) {
      that.emit("done");
    } else {
      that.emit("prompt_pass");
    }
  });
}

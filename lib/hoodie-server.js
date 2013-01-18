var cors_http = require("corsproxy");
var static_http = require("connect/lib/middleware/static");

module.exports = make_hoodie_server;

function make_hoodie_server(couchdb, name, host) {
  hoodie_server.couchdb = couchdb;
  this.name = name;
  this.host = host;
  return hoodie_server.bind(this);
}

make_hoodie_server.prototype.serve_static = function(host, name) {
  if(host == name + "." + this.host) {
    return true;
  } else {
    return false;
  }
};

make_hoodie_server.prototype.serve_cors = function(host, name) {
  if(host == "api." + name + "." + this.host) {
    return true;
  } else {
    return false;
  }
};

var hoodie_server = function(req, res, proxy) {

  var host = req.headers.host;

  // frontend proxy duties
  //   if host == APPNAME.domain
  //     serve ./www
  if(this.serve_static(host, this.name)) {
    console.log("serve static req");
    var static_server = static_http("./www");
    return static_server(req, res, function() {});
  }
  //   if host == api.APPNAME.domain
  //     serve CORS
  if(this.serve_cors(host, this.name)) {
    console.log("serve api req");
    cors_http.options = {
      target: this.couchdb
    }
    return cors_http(req, res, proxy);
  }

  // launch httpd for Admin UI on $PORT + 1
  // TBD

  // TBD add default handler
};

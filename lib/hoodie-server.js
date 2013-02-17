var cors_http = require("corsproxy");
var static_http = require("connect/lib/middleware/static");
var url = require("url");

module.exports = make_hoodie_server;

function make_hoodie_server(name, host, couch_url) {
  this.couchdb = couch_url,
  this.name = name;
  this.host = host;
  return hoodie_server.bind(this);
}

make_hoodie_server.prototype.serve_static = function(host, name) {
  if((host == "www." + name + "." + this.host)
    || (host == name + "." + this.host)) {
    return true;
  } else {
    return false;
  }
};

make_hoodie_server.prototype.serve_cors = function(host, name) {
  var suffix = name + "." + this.host;
  var matcher = new RegExp("api." + suffix + "$");

  return matcher.test(host);
};

make_hoodie_server.prototype.serve_admin = function(host, name) {
  if(host == "admin." + name + "." + this.host) {
    return true;
  } else {
    return false;
  }
};

make_hoodie_server.prototype.serve_api = function(req) {
  return req.url.match(/^\/_api/);
}

var hoodie_server = function(req, res, proxy) {

  var host = req.headers.host;
  var static_server, admin_server;

  // if req.url == ^/_api*
  //   serve couch request
  if(this.serve_api(req)) {
    var parsed_url = url.parse(this.couchdb);
    // proxy to this.couch_url
    var target = {
      host: parsed_url.hostname,
      port: parsed_url.port
    };
    var new_url = req.url.replace(/^\/_api/, "");
    console.log("[api req] ie fallback %s %s %j/%s", req.method, req.url, target, new_url);
    req.url = new_url;
    req.headers.host = "couch." + host;
    return proxy.proxyRequest(req, res, target);
  }

  // frontend proxy duties
  //   if host == [www.]APPNAME.domain
  //     serve ./www
  if(this.serve_static(host, this.name)) {
    console.log("[static req] %s %s", req.method, req.url);
    static_server = static_http("./www");
    return static_server(req, res, function() {});
  }

  //   if host == *api.APPNAME.domain
  //     serve CORS
  if(this.serve_cors(host, this.name)) {
    console.log("[api req] %s %s", req.method, req.url);
    cors_http.options = {
      target: this.couchdb
    }
    return cors_http(req, res, proxy);
  }

  // launch httpd for Admin UI
  //   if host == admin.APPNAME.domain
  //     serve ./node-modules/hoodie-app/www
  if(this.serve_admin(host, this.name)) {
    console.log("[admin req] %s %s", req.method, req.url);
    admin_server = static_http("./node_modules/hoodie-app/node_modules/hoodie-pocket/www");
    return admin_server(req, res, function() {});
  }

  // TBD add default handler
};

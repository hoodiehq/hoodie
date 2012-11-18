// server.js
// Start a Hoodie app
// var HTTPServer = require("http-server");
// var cors_proxy = require("corsproxy");
var http_proxy = require("http-proxy");
var cors_http = require("corsproxy");
var static_http = require("connect/lib/middleware/static");
var fs = require("fs");

var host = "0.0.0.0";
var port = parseInt(process.env.port, 10) || 80;

var couchdb = process.env.couchdb_url;
var package_json = JSON.parse(fs.readFileSync("./package.json"));
var name = package_json.name;

// verify CouchDB service
// TBD


var hoodie_server = function(req, res, proxy) {
  var host = req.headers.host;
  console.log(host);
  // frontend proxy duties
  //   if host == APPNAME
  //     serve ./www
  if(host == name + ".jit.su") {
    console.log("serve static req");
    static_server = static_http("./www");
    return static_server(req, res, function() {});
  }
  //   if host == api.APPNAME
  //     serve CORS
  if(host == "api." + name + ".jit.su") {
    console.log("serve api req");
    cors_http.options = {
      target: couchdb
    }
    return cors_http(req, res, proxy);
  }

  // launch httpd for Admin UI on $PORT + 1
  // TBD

  // TBD add default handler

}

// start frontend proxy
var server = http_proxy.createServer(hoodie_server);
server.listen(port, function() {
  console.log("hoodie server started on port '%d'", port);
  console.log("Your app is ready now.");
});


var worker_names = [];
var deps = package_json.dependencies;
for(var dep in deps) {
  if(dep.substr(-7) == "-worker") {
    worker_names.push(dep);
  }
}

// for each package_json/worker*
var workers = worker_names.map(function(worker_name) {
  console.log("starting: '%s'", worker_name);
  // start worker
  var worker = require(worker_name);
  return new worker(process.env);
});
console.log("All workers started.");


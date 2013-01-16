// server.js
// Start a Hoodie app
var fs = require("fs");
var http_proxy = require("http-proxy");
var hoodie_server = require("./hoodie-server");
var MultiCouch = require("multicouch");

var host = "0.0.0.0";
var port = parseInt(process.env.port, 10) || 80;

var package_json = JSON.parse(fs.readFileSync("./package.json"));
var couchdb_url = process.env.couchdb_url;

var home = process.env.HOME;

// prepare hoodir dirs if they don’t exist:
// mkdir -p $HOME/Application Support/Hoodie/Apps/myapp/
mkdir_p(home + "/Library/Application Support/Hoodie");
mkdir_p(home + "/Library/Application Support/Hoodie/Apps");
mkdir_p(home + "/Library/Application Support/Hoodie/Apps/" + package_json.name);

// if we are on nodejitsu, we require couch_url.
if(process.env.SUBDOMAIN) { // we are on nodejitsu
  // TODO: verify couchdb_url is reachable
} else {
  // if we are not on nodejitsu, make us a couch
  var couchdb = new MultiCouch({
    prefix: home + "/Library/Application Support/Hoodie/Apps/" + package_json.name,
    port: port + 1
  });
  couchdb.start();
  couchdb.on("start", function() {
    console.log("CouchDB Started");
  });
}


var hoo = new hoodie_server(couchdb, package_json.name, "jit.su");
// start frontend proxy
var server = http_proxy.createServer(hoo);
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

function mkdir_p(dir) {
  try {
    fs.mkdirSync(dir);
  } catch(e) {
    // console.log(e);
    // nope
  }
}

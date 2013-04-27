// Start a Hoodie app
var fs = require("fs");
var npm = require("npm");
var request = require("request");
var readline = require("readline");
var http_proxy = require("http-proxy");
var MultiCouch = require("multicouch");
var exec = require("child_process").exec;
var hoodie_server = require("./hoodie-server");
var HoodieInstaller = require("./hoodie-installer");
var ltld = require("local-tld-lib");

var host = "0.0.0.0";
var http_port = parseInt(process.env.port, 10) || 80;
var domain = "dev";

var package_json = JSON.parse(fs.readFileSync("./package.json"));
var name = package_json.name.toLowerCase();
var couch_url = "http://couch." + name + "." + domain + ":80";

var hoodie = {};

var home = process.env.HOME;


// set up domain names based on the environment we run in

// if we are local, start a couch

// run setup

// start hoodie service

// start workers

// if we are on nodejitsu, we require couch_url.
if(process.env.SUBDOMAIN) { // we are on nodejitsu
  domain = "jit.su";
  couch_url = process.env.COUCH_URL;
  // TODO: verify couchdb_url is reachable
  couch_port = 5984;
  if(!couch_url) {
    throw "FATAL: NO COUCH URL"
  }

  console.log("starting in nodejitsu. ENV debug:");
  console.log(process.env)

  setup();
} else {
  var http_port = ltld.getPort(name);
  var couch_port = ltld.getPort("couch." + name);
  ltld.setAlias(name, "www");
  ltld.setAlias(name, "admin");
  ltld.setAlias(name, "api");

  console.log("Start local couch on port: %d", couch_port);
  // prepare hoodir dirs if they don’t exist:
  // mkdir -p $HOME/Application Support/Hoodie/Apps/myapp/
  mkdir_p(home + "/Library/Hoodie");
  mkdir_p(home + "/Library/Hoodie/Apps");
  mkdir_p(home + "/Library/Hoodie/Apps/" + name);
  // if we are not on nodejitsu, make us a couch
  var couchdb = new MultiCouch({
    prefix: home + "/Library/Hoodie/Apps/" + name,
    port: couch_port
  });

  couchdb.on("start", function() {
    console.log("CouchDB Started");
    setTimeout(setup, 2000);
  });

  couchdb.on("error", function(error) {
    console.log("CouchDB Error: %j", error);
  });

  process.on("exit", function() {
    couchdb.stop();
    console.log("CouchDB stop triggered by exit");
  });

  // on ctrl-c, stop couchdb first, then exit.
  process.on("SIGINT", function() {
    couchdb.on("stop", function() {
      process.exit(0);
    });
    couchdb.stop();
  });

  couchdb.start();
}

var hoo = new hoodie_server(name, domain, couch_url);
// start frontend proxy
var server = http_proxy.createServer(hoo);
server.listen(http_port, "0.0.0.0", function() {
  console.log("hoodie server started on port '%d'", http_port);
});

function start_workers() {
  var worker_names = [];
  var deps = package_json.dependencies;
  for(var dep in deps) {
    if(dep.substr(0, 7) == "worker-") {
      worker_names.push(dep);
    }
  }

  npm.load(function(error, npm) {
    var password = npm.config.get(name + "_admin_pass");
    // for each package_json/worker*

    // if port is not set, set it explicitely
    if( ! /:\d+$/.test(couch_url)) {
      couch_url = couch_url + ":80";
    }
    var config = {
      server: couch_url,
      admin: {
        user: "admin",
        pass: password || process.env["HOODIE_ADMIN_PASS"]
      },
      persistent_since_storage: false
    };
    var workers = worker_names.map(function(worker_name) {
      console.log("starting: '%s'", worker_name);
      // start worker

      var worker = require("hoodie-" + worker_name);
      config.name = worker_name.replace(/^worker-/, '');

      // temp debug
      console.log("initializing %s worker with: ", name)
      console.log(JSON.parse(JSON.stringify(config)));
      return new worker(JSON.parse(JSON.stringify(config)));
    });
    console.log("All workers started.");
    console.log("Your App is ready now.");
  });
}

function setup() {
  var installer = new HoodieInstaller(name, couch_url);

  installer.on("done", function() {

    // setup modules DB
    npm.load(function(error, npm) {
      if(error) {
        throw error;
      }
      var password = npm.config.get(name + "_admin_pass") || process.env["HOODIE_ADMIN_PASS"];
      if(!password) {
        throw "FATAL: No password found.";
      }
      //otherwise authentication with only digit passwords fails
      password = password.toString();

      request({
        url: couch_url + "/modules",
        method: "PUT",
        auth: {
          user: "admin",
          pass: password
        }
      }, function(error, response, body) {
        if(error) {
          throw error;
        }

        var object = {
          _id : "module/appconfig",
          config : {},
          name: name,
          createdAt : new Date(),
          updatedAt : new Date()
        }

        request({
          url: couch_url + "/modules/module%2Fappconfig",
          method: "PUT",
          auth: {
              user: "admin",
              pass: password
          },
          body: JSON.stringify(object)
        }, function(error, response, body) {
          if(error) {
            throw error;
          }

          console.log("setup done");

          // boom
          console.log("");
          console.log("open http://%s.%s in your browser", name, domain);
          console.log("");
          exec('open http://' + name + '.' + domain)

          var HoodieLog = require("./hoodie-log");
          hoodie.log = new HoodieLog(name, couch_url);

          start_workers();
        });

        request({
          url: couch_url + "/modules/_security",
          method: "PUT",
          auth: {
             user: "admin",
             pass: password
          },
          body: JSON.stringify({"admins": {"names": [],"roles": []},"members": {"names": [],"roles": ["_admin"]}})
        }, function(error, response, body) {
          if(error) {
            throw error;
          }
        });
      });
    });

  });

  installer.on("prompt_pass", function () {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Please set an admin password for this app: ", function(password) {
      if(!password) {
        console.log("FATAL: please supply a password");
        process.exit(1);
      }
      installer.emit("set_password", password);
      rl.close();
    });
  });

  installer.on("set_password", function(password) {
    request({
      url: couch_url + "/_config/admins/admin",
      method: "PUT",
      body: '"' + password + '"'
    }, function(error) {
      if(error !== null) {
        console.trace("set_password");
        console.log(error);
        throw error;
      }
      npm.load(function(error, npm) {
        if(error !== null) {
          console.log(error)
          throw error;
        }
        var config = {
          key: name + "_admin_pass",
          value: password
        };
        var result = npm.commands.config(["set", config.key, config.value]);
      });
      installer.emit("done");
    });
  });
}

// * * *

function mkdir_p(dir) {
  try {
    fs.mkdirSync(dir);
  } catch(e) {
    // nope
  }
}

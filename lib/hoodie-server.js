var cors_http = require("corsproxy");
var static_http = require("ecstatic");
var url = require("url");
var fs = require("fs");
var os = require("os");

module.exports = make_hoodie_server;

function make_hoodie_server(name, host, couch_url, catchall) {
  this.couchdb = couch_url;
  this.catchall = catchall || true;
  this.name = name;
  this.host = host;
  this.dns_alias_host = "xip.io";
  this.local_ips = this.get_local_ips();
  return hoodie_server.bind(this);
}

make_hoodie_server.prototype.serve_static = function(host, name) {
  var match_hosts = [
    "www." + name + "." + this.host,
    name + "." + this.host
  ];

  this.local_ips.forEach(function(local_ip) {
    match_hosts.push("www." + name + "." + local_ip + "." + this.dns_alias_host);
    match_hosts.push(name + "." + local_ip + "." + this.dns_alias_host);
  }, this);

  if(match_hosts.indexOf(host) !== -1) {
    return true;
  } else {
    return false;
  }
};

make_hoodie_server.prototype.serve_cors = function(host, name) {
  var hosts = this.local_ips.map(function(local_ip) {
    return local_ip + "." + this.dns_alias_host;
  }, this);
  hosts.push(this.host);
  var suffix = name + "." + "(" + hosts.join("|") + ")";
  var matcher = new RegExp("api." + suffix + "$");

  return matcher.test(host);
};

make_hoodie_server.prototype.serve_admin = function(host, name) {
  var match_hosts = [
    "admin." + name + "." + this.host
  ];

  this.local_ips.forEach(function(local_ip) {
    match_hosts.push("admin." + name + "." + local_ip + "." + this.dns_alias_host);
  }, this);

  if(match_hosts.indexOf(host) !== -1) {
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
    req.headers.host = parsed_url.hostname + ":" + parsed_url.port;
    return proxy.proxyRequest(req, res, target);
  }

  // frontend proxy duties
  //   if host == [www.]APPNAME.domain
  //     serve ./www
  if(this.serve_static(host, this.name)) {
    console.log("[static req] %s %s", req.method, req.url);
    static_server = static_http("./www", { defaultExt: 'html' });
    var that = this;
    return static_server(req, res, function() {
      handle_static_404(res, "static", that);
    });
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
    var that = this;
    return admin_server(req, res, function() {
      handle_static_404(res, "admin", that);
    });
  }

  // default handler
  console.log("[unknown req] %s %s", req.method, req.url);
  res.writeHead(404, "Not Found");
  res.end("404 Not Found");
};

var handle_static_404 = function handle_static_404(res, type, that) {
  // if this.catchall is true, serve ./www/index.html
  if(that.catchall) {
    console.log("-> [%s req] redirect to index.html", type);
    res.writeHead(201, "OK");
    var file = fs.createReadStream("./www/index.html");
    file.pipe(res);
  } else {
    console.log("-> [%s req] 404", type);
    res.writeHead(404, "Not Found");
    res.end("Not Found");
  }
}

make_hoodie_server.prototype.get_local_ips = function get_local_ips()
{
  var ifconfig = os.networkInterfaces();
  var local_ips = [];
  var if_name;

  for(if_name in ifconfig) {
    if(if_name.substr(0, 2) != "en") {
      continue; // for other unixes learn other interface names
    }
    var _if = ifconfig[if_name];
    _if.forEach(function(address_info) {
      if(address_info.internal) {
        return; // no loopback!
      }

      if(address_info.family == 'IPv6') {
        return; // no
      }

      local_ips.push(address_info.address);

    });
  }
  return local_ips;
}

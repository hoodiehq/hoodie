var assert = require("assert");
var hs = require("../lib/hoodie-server").prototype;

// fake dat constructor
hs.host = "jit.su";
hs.dns_alias_host = "xip.io";
hs.local_ips = hs.get_local_ips();


describe("hoodie-server", function() {
  describe("request routing", function() {

    it("should serve static", function() {
      assert(hs.serve_static("a.jit.su", "a"));
    });

    it("should serve cors", function() {
      assert(hs.serve_cors("api.a.jit.su", "a"));
    });

    it("should serve cors wildcard", function() {
      assert(hs.serve_cors("foo.api.a.jit.su", "a"));
    });

    it("should serve admin", function() {
      assert(hs.serve_admin("admin.a.jit.su", "a"));
    });

    it("should serve /_api IE <= 9 fallback", function() {
      assert(hs.serve_api({
        url: "/_api"
      }));
    });

    it("should serve /_api IE <= 9 fallback", function() {
      assert(hs.serve_api({
        url: "/_api/db?param=true"
      }));
    });

    it("should fail with app name mismatch", function() {
      assert.equal(false, hs.serve_cors("a.jit.su", "b"));
    });

    it("should fail cors with api name mismatch", function() {
      assert.equal(false, hs.serve_cors("api.a.jit.su", "b"));
    });


    // xip.io
    it("static should handle xip.io domains", function() {
      var host = "a." + hs.local_ips[0] + "." + hs.dns_alias_host;
      assert.equal(true, hs.serve_static(host, "a"));
    });

    it("static www should handle xip.io domains", function() {
      var host = "www.a." + hs.local_ips[0] + "." + hs.dns_alias_host;
      assert.equal(true, hs.serve_static(host, "a"));
    });

    it("api should handle xip.io domains", function() {
      var host = "api.a." + hs.local_ips[0] + "." + hs.dns_alias_host;
      assert.equal(true, hs.serve_cors(host, "a"));
    });

    it("api should handle wildcard xip.io domains", function() {
      var host = "foo.api.a." + hs.local_ips[0] + "." + hs.dns_alias_host;
      assert.equal(true, hs.serve_cors(host, "a"));
    });

    it("admin should handle xip.io domains", function() {
      var host = "admin.a." + hs.local_ips[0] + "." + hs.dns_alias_host;
      assert.equal(true, hs.serve_admin(host, "a"));
    });

  });
});

// test router, default route

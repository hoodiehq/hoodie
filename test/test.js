var assert = require("assert");
var hs = require("../lib/hoodie-server").prototype;
hs.host = "jit.su";

describe("hoodie-server", function() {
  describe("request routing", function() {

    it("should serve static", function() {
      assert(hs.serve_static("a.jit.su", "a"));
    });

    it("should serve cors", function() {
      assert(hs.serve_cors("api.a.jit.su", "a"));
    });

    it("should serve admin", function() {
      assert(hs.serve_admin("admin.a.jit.su", "a"));
    });

    it("should fail with app name mismatch", function() {
      assert.equal(false, hs.serve_cors("a.jit.su", "b"));
    });

    it("should fail cors with api name mismatch", function() {
      assert.equal(false, hs.serve_cors("api.a.jit.su", "b"));
    });

  });
});

// test router, default route

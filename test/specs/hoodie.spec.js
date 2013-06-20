describe("Hoodie", function() {

  beforeEach(function() {
    this.hoodie = new Hoodie('http://couch.example.com');
    this.ajaxDefer = $.Deferred();

    spyOn($, "ajax").andReturn(this.ajaxDefer.promise());

    spyOn(window, "setTimeout").andCallFake(function(cb) {
      return cb;
    });

  });

  describe("constructor", function() {

    it("should store the CouchDB URL", function() {
      var hoodie = new Hoodie('http://couch.example.com');
      return expect(hoodie.baseUrl).toBe('http://couch.example.com');
    });

    it("should remove trailing slash from passed URL", function() {
      var hoodie;
      hoodie = new Hoodie('http://couch.example.com/');
      return expect(hoodie.baseUrl).toBe('http://couch.example.com');
    });
    it("should default the CouchDB URL to current domain with a api subdomain", function() {
      var hoodie;
      hoodie = new Hoodie;
      return expect(hoodie.baseUrl).toBe("/_api");
    });
    it("should check connection", function() {
      var hoodie;
      spyOn(Hoodie.prototype, "checkConnection");
      hoodie = new Hoodie;
      return expect(Hoodie.prototype.checkConnection).wasCalled();
    });
    return it("store has to be initialized before remote", function() {
      var hoodie, order;
      order = [];
      spyOn(Hoodie, "LocalStore").andCallFake(function() {
        order.push('store');
        return new Mocks.Hoodie().store;
      });
      spyOn(Hoodie, "AccountRemote").andCallFake(function() {
        order.push('remote');
        return new Mocks.Hoodie().remote;
      });
      hoodie = new Hoodie;
      return expect(order.join(',')).toBe('store,remote');
    });
  });
  describe("#request(type, path, options)", function() {
    _when("request('GET', '/')", function() {
      beforeEach(function() {
        var args;
        this.hoodie.request('GET', '/');
        return this.args = args = $.ajax.mostRecentCall.args[0];
      });
      it("should send a GET request to http://couch.example.com/", function() {
        expect(this.args.type).toBe('GET');
        return expect(this.args.url).toBe('http://couch.example.com/');
      });
      it("should set `dataType: 'json'", function() {
        return expect(this.args.dataType).toBe('json');
      });
      it("should set `xhrFields` to `withCredentials: true`", function() {
        return expect(this.args.xhrFields.withCredentials).toBe(true);
      });
      it("should set `crossDomain: true`", function() {
        return expect(this.args.crossDomain).toBe(true);
      });
      return it("should return a promise", function() {
        return expect(this.hoodie.request('GET', '/')).toBePromise();
      });
    });
    _when("request 'POST', '/test', data: funky: 'fresh'", function() {
      beforeEach(function() {
        var args;
        this.hoodie.request('POST', '/test', {
          data: {
            funky: 'fresh'
          }
        });
        return this.args = args = $.ajax.mostRecentCall.args[0];
      });
      return it("should send a POST request to http://couch.example.com/test", function() {
        expect(this.args.type).toBe('POST');
        return expect(this.args.url).toBe('http://couch.example.com/test');
      });
    });
    _when("request('GET', 'http://api.otherapp.com/')", function() {
      beforeEach(function() {
        var args;
        this.hoodie.request('GET', 'http://api.otherapp.com/');
        return this.args = args = $.ajax.mostRecentCall.args[0];
      });
      return it("should send a GET request to http://api.otherapp.com/", function() {
        expect(this.args.type).toBe('GET');
        return expect(this.args.url).toBe('http://api.otherapp.com/');
      });
    });
    return _when("request fails with empty response", function() {
      beforeEach(function() {
        return this.ajaxDefer.reject({
          xhr: {
            responseText: ''
          }
        });
      });
      return xit("should return a rejected promis with Cannot reach backend error", function() {
        return expect(this.hoodie.request('GET', '/')).toBeRejectedWith({
          error: 'Cannot connect to backend at http://couch.example.com'
        });
      });
    });
  });
  describe("#checkConnection()", function() {
    beforeEach(function() {
      this.requestDefer = this.hoodie.defer();
      this.hoodie._checkConnectionRequest = null;
      spyOn(this.hoodie, "request").andReturn(this.requestDefer.promise());
      spyOn(this.hoodie, "trigger");
      return window.setTimeout.andReturn(null);
    });
    it("should send GET / request", function() {
      this.hoodie.checkConnection();
      return expect(this.hoodie.request).wasCalledWith('GET', '/');
    });
    it("should only send one request at a time", function() {
      this.hoodie.checkConnection();
      this.hoodie.checkConnection();
      return expect(this.hoodie.request.callCount).toBe(1);
    });
    _when("hoodie is online", function() {
      beforeEach(function() {
        return this.hoodie.online = true;
      });
      _and("request succeeds", function() {
        beforeEach(function() {
          this.requestDefer.resolve({
            "couchdb": "Welcome",
            "version": "1.2.1"
          });
          return this.hoodie.checkConnection();
        });
        it("should check again in 30 seconds", function() {
          return expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 30000);
        });
        return it("should not trigger `reconnected` event", function() {
          return expect(this.hoodie.trigger).wasNotCalledWith('reconnected');
        });
      });
      return _and("request fails", function() {
        beforeEach(function() {
          this.requestDefer.reject({
            "status": 0,
            "statusText": "Error"
          });
          return this.hoodie.checkConnection();
        });
        it("should check again in 3 seconds", function() {
          return expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 3000);
        });
        return it("should trigger `disconnected` event", function() {
          return expect(this.hoodie.trigger).wasCalledWith('disconnected');
        });
      });
    });
    return _when("hoodie is offline", function() {
      beforeEach(function() {
        return this.hoodie.online = false;
      });
      _and("request succeeds", function() {
        beforeEach(function() {
          this.requestDefer.resolve({
            "couchdb": "Welcome",
            "version": "1.2.1"
          });
          return this.hoodie.checkConnection();
        });
        it("should check again in 30 seconds", function() {
          return expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 30000);
        });
        return it("should trigger `reconnected` event", function() {
          return expect(this.hoodie.trigger).wasCalledWith('reconnected');
        });
      });
      return _and("request fails", function() {
        beforeEach(function() {
          this.requestDefer.reject({
            "status": 0,
            "statusText": "Error"
          });
          return this.hoodie.checkConnection();
        });
        it("should check again in 3 seconds", function() {
          return expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 3000);
        });
        return it("should not trigger `disconnected` event", function() {
          return expect(this.hoodie.trigger).wasNotCalledWith('disconnected');
        });
      });
    });
  });
  describe("#open(store, options)", function() {
    return it("should instantiate a Remote instance", function() {
      spyOn(Hoodie, "Remote");
      this.hoodie.open("store_name", {
        option: "value"
      });
      return expect(Hoodie.Remote).wasCalledWith(this.hoodie, {
        name: "store_name",
        option: "value"
      });
    });
  });
  describe("#uuid(num = 7)", function() {
    it("should default to a length of 7", function() {
      return expect(this.hoodie.uuid().length).toBe(7);
    });
    return _when("called with num = 5", function() {
      return it("should generate an id with length = 5", function() {
        return expect(this.hoodie.uuid(5).length).toBe(5);
      });
    });
  });
  describe("#isPromise(object)", function() {
    it("should return true if object is a promise", function() {
      var object;
      object = $.Deferred().promise();
      return expect(this.hoodie.isPromise(object)).toBe(true);
    });
    it("should return false for deferred objects", function() {
      var object;
      object = $.Deferred();
      return expect(this.hoodie.isPromise(object)).toBe(false);
    });
    return it("should return false when object is undefined", function() {
      return expect(this.hoodie.isPromise(void 0)).toBe(false);
    });
  });
  describe("#resolve()", function() {
    it("simply returns resolved promise", function() {
      return expect(this.hoodie.resolve()).toBeResolved();
    });
    return it("should be applyable", function() {
      var promise;
      promise = this.hoodie.reject().then(null, this.hoodie.resolve);
      return expect(promise).toBeResolved();
    });
  });
  describe("#reject()", function() {
    it("simply returns rejected promise", function() {
      return expect(this.hoodie.reject()).toBeRejected();
    });
    return it("should be applyable", function() {
      var promise;
      promise = this.hoodie.resolve().then(this.hoodie.reject);
      return expect(promise).toBeRejected();
    });
  });
  describe("#resolveWith(something)", function() {
    it("wraps passad arguments into a promise and returns it", function() {
      var promise;
      promise = this.hoodie.resolveWith('funky', 'fresh');
      return expect(promise).toBeResolvedWith('funky', 'fresh');
    });
    return it("should be applyable", function() {
      var promise;
      promise = this.hoodie.rejectWith(1, 2).then(null, this.hoodie.resolveWith);
      return expect(promise).toBeResolvedWith(1, 2);
    });
  });
  describe("#rejectWith(something)", function() {
    it("wraps passad arguments into a promise and returns it", function() {
      var promise;
      promise = this.hoodie.rejectWith('funky', 'fresh');
      return expect(promise).toBeRejectedWith('funky', 'fresh');
    });
    return it("should be applyable", function() {
      var promise;
      promise = this.hoodie.resolveWith(1, 2).then(this.hoodie.rejectWith);
      return expect(promise).toBeRejectedWith(1, 2);
    });
  });
  return describe("#dispose()", function() {
    beforeEach(function() {
      return spyOn(this.hoodie, "trigger");
    });
    return it("should trigger `dispose` event", function() {
      this.hoodie.dispose();
      return expect(this.hoodie.trigger).wasCalledWith('dispose');
    });
  });
});

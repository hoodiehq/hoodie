describe("Hoodie", function() {

  'use strict';

  beforeEach(function() {
    this.hoodie = new Hoodie('http://couch.example.com');
    this.ajaxDefer = $.Deferred();
    var ajaxPromise = this.ajaxDefer.promise()
    ajaxPromise.abort = function() {}
    spyOn($, "ajax").andReturn(ajaxPromise);

    spyOn(window, "setTimeout").andCallFake(function(cb) {
      return cb;
    });

  });

  describe("constructor", function() {

    it("should store the CouchDB URL", function() {
      var hoodie = new Hoodie('http://couch.example.com');
      expect(hoodie.baseUrl).toBe('http://couch.example.com');
    });

    it("should remove trailing slash from passed URL", function() {
      var hoodie = new Hoodie('http://couch.example.com/');
      expect(hoodie.baseUrl).toBe('http://couch.example.com');
    });

    it("should default the CouchDB URL to current domain with a api subdomain", function() {
      var hoodie = new window.Hoodie();
      expect(hoodie.baseUrl).toBe("/_api");
    });

    it("should check connection", function() {
      var hoodie;
      spyOn(Hoodie.prototype, "checkConnection");
      hoodie = new window.Hoodie();
      expect(Hoodie.prototype.checkConnection).wasCalled();
    });

    it("store has to be initialized before remote", function() {
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
      hoodie = new window.Hoodie();
      expect(order.join(',')).toBe('store,remote');
    });
  });

  describe("#request(type, path, options)", function() {

    // see http://bugs.jquery.com/ticket/14104
    it("should return a jQuery.ajax compatible promise", function() {
      var promise = this.hoodie.request('GET', '/');
      expect(promise).toBePromise();
      expect(promise.abort).toBeDefined();
    });
    _when("request('GET', '/')", function() {
      beforeEach(function() {
        var args;
        this.hoodie.request('GET', '/');
        this.args = args = $.ajax.mostRecentCall.args[0];
      });
      it("should send a GET request to http://couch.example.com/", function() {
        expect(this.args.type).toBe('GET');
        expect(this.args.url).toBe('http://couch.example.com/');
      });
      it("should set `dataType: 'json'", function() {
        expect(this.args.dataType).toBe('json');
      });
      it("should set `xhrFields` to `withCredentials: true`", function() {
        expect(this.args.xhrFields.withCredentials).toBe(true);
      });
      it("should set `crossDomain: true`", function() {
        expect(this.args.crossDomain).toBe(true);
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
        this.args = args = $.ajax.mostRecentCall.args[0];
      });
      it("should send a POST request to http://couch.example.com/test", function() {
        expect(this.args.type).toBe('POST');
        expect(this.args.url).toBe('http://couch.example.com/test');
      });
    });

    _when("request('GET', 'http://api.otherapp.com/')", function() {
      beforeEach(function() {
        var args;
        this.hoodie.request('GET', 'http://api.otherapp.com/');
        this.args = args = $.ajax.mostRecentCall.args[0];
      });
      it("should send a GET request to http://api.otherapp.com/", function() {
        expect(this.args.type).toBe('GET');
        expect(this.args.url).toBe('http://api.otherapp.com/');
      });
    });
    _when("request fails with empty response", function() {
      beforeEach(function() {
        this.ajaxDefer.reject({
          xhr: {
            responseText: ''
          }
        });
      });
      xit("should return a rejected promis with Cannot reach backend error", function() {
        expect(this.hoodie.request('GET', '/')).toBeRejectedWith({
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
      window.setTimeout.andReturn(null);
    });
    it("should send GET / request", function() {
      this.hoodie.checkConnection();
      expect(this.hoodie.request).wasCalledWith('GET', '/');
    });
    it("should only send one request at a time", function() {
      this.hoodie.checkConnection();
      this.hoodie.checkConnection();
      expect(this.hoodie.request.callCount).toBe(1);
    });
    _when("hoodie is online", function() {
      beforeEach(function() {
        this.hoodie.online = true;
      });
      _and("request succeeds", function() {
        beforeEach(function() {
          this.requestDefer.resolve({
            "couchdb": "Welcome",
            "version": "1.2.1"
          });
          this.hoodie.checkConnection();
        });
        it("should check again in 30 seconds", function() {
          expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 30000);
        });
        it("should not trigger `reconnected` event", function() {
          expect(this.hoodie.trigger).wasNotCalledWith('reconnected');
        });
      });
      _and("request fails", function() {
        beforeEach(function() {
          this.requestDefer.reject({
            "status": 0,
            "statusText": "Error"
          });
          this.hoodie.checkConnection();
        });
        it("should check again in 3 seconds", function() {
          expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 3000);
        });
        it("should trigger `disconnected` event", function() {
          expect(this.hoodie.trigger).wasCalledWith('disconnected');
        });
      });
    });
    _when("hoodie is offline", function() {
      beforeEach(function() {
        this.hoodie.online = false;
      });
      _and("request succeeds", function() {
        beforeEach(function() {
          this.requestDefer.resolve({
            "couchdb": "Welcome",
            "version": "1.2.1"
          });
          this.hoodie.checkConnection();
        });
        it("should check again in 30 seconds", function() {
          expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 30000);
        });
        it("should trigger `reconnected` event", function() {
          expect(this.hoodie.trigger).wasCalledWith('reconnected');
        });
      });
      _and("request fails", function() {
        beforeEach(function() {
          this.requestDefer.reject({
            "status": 0,
            "statusText": "Error"
          });
          this.hoodie.checkConnection();
        });
        it("should check again in 3 seconds", function() {
          expect(window.setTimeout).wasCalledWith(this.hoodie.checkConnection, 3000);
        });
        it("should not trigger `disconnected` event", function() {
          expect(this.hoodie.trigger).wasNotCalledWith('disconnected');
        });
      });
    });
  });

  describe("#open(store, options)", function() {
    it("should instantiate a Remote instance", function() {
      spyOn(Hoodie, "Remote");
      this.hoodie.open("store_name", {
        option: "value"
      });
      expect(Hoodie.Remote).wasCalledWith(this.hoodie, {
        name: "store_name",
        option: "value"
      });
    });
  });

  describe("#uuid(num = 7)", function() {

    it("should default to a length of 7", function() {
      expect(this.hoodie.uuid().length).toBe(7);
    });

    _when("called with num = 5", function() {
      it("should generate an id with length = 5", function() {
        expect(this.hoodie.uuid(5).length).toBe(5);
      });
    });
  });

  describe("#isPromise(object)", function() {
    it("should return true if object is a promise", function() {
      var object;
      object = $.Deferred().promise();
      expect(this.hoodie.isPromise(object)).toBe(true);
    });
    it("should return false for deferred objects", function() {
      var object;
      object = $.Deferred();
      expect(this.hoodie.isPromise(object)).toBe(false);
    });
    it("should return false when object is undefined", function() {
      expect(this.hoodie.isPromise(void 0)).toBe(false);
    });
  });

  describe("#resolve()", function() {
    it("simply returns resolved promise", function() {
      expect(this.hoodie.resolve()).toBeResolved();
    });
    it("should be applyable", function() {
      var promise = this.hoodie.reject().then(null, this.hoodie.resolve);
      expect(promise).toBeResolved();
    });
  });

  describe("#reject()", function() {
    it("simply returns rejected promise", function() {
      expect(this.hoodie.reject()).toBeRejected();
    });
    it("should be applyable", function() {
      var promise;
      promise = this.hoodie.resolve().then(this.hoodie.reject);
      expect(promise).toBeRejected();
    });
  });

  describe("#resolveWith(something)", function() {

    it("wraps passad arguments into a promise and returns it", function() {
      var promise;
      promise = this.hoodie.resolveWith('funky', 'fresh');
      expect(promise).toBeResolvedWith('funky', 'fresh');
    });
    it("should be applyable", function() {
      var promise = this.hoodie.rejectWith(1, 2).then(null, this.hoodie.resolveWith);
      expect(promise).toBeResolvedWith(1, 2);
    });
  });

  describe("#rejectWith(something)", function() {

    it("wraps passad arguments into a promise and returns it", function() {
      var promise;
      promise = this.hoodie.rejectWith('funky', 'fresh');
      expect(promise).toBeRejectedWith('funky', 'fresh');
    });
    it("should be applyable", function() {
      var promise;
      promise = this.hoodie.resolveWith(1, 2).then(this.hoodie.rejectWith);
      expect(promise).toBeRejectedWith(1, 2);
    });

  });

  describe("#dispose()", function() {
    beforeEach(function() {
      spyOn(this.hoodie, "trigger");
    });

    it("should trigger `dispose` event", function() {
      this.hoodie.dispose();
      expect(this.hoodie.trigger).wasCalledWith('dispose');
    });
  });

});

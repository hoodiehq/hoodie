describe("Hoodie.AccountRemote", function() {

  'use strict';

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();
    spyOn(this.hoodie, "on");
    spyOn(this.hoodie, "one");
    spyOn(this.hoodie, "unbind");
    this.requestDefer = this.hoodie.defer();
    var promise = this.requestDefer.promise();
    promise.abort = function(){};
    spyOn(this.hoodie, "request").andReturn(promise);
    spyOn(window, "setTimeout");
    spyOn(this.hoodie.account, "db").andReturn('userhash123');
    spyOn(this.hoodie, "trigger");
    spyOn(this.hoodie, "checkConnection");
    spyOn(this.hoodie.store, "remove").andReturn({
      then: function(cb) {
        return cb('objectFromStore');
      }
    });
    spyOn(this.hoodie.store, "update").andReturn({
      then: function(cb) {
        return cb('objectFromStore', false);
      }
    });
    spyOn(this.hoodie.store, "save").andReturn({
      then: function(cb) {
        return cb('objectFromStore', false);
      }
    });
    hoodieRemote(this.hoodie);
    this.remote = this.hoodie.remote;
  });
  // describe("constructor(@hoodie, options = {})", function() {
  //   beforeEach(function() {
  //     spyOn(Hoodie.AccountRemote.prototype, "disconnect");
  //     spyOn(Hoodie.AccountRemote.prototype, "connect");
  //     this.remote = new Hoodie.AccountRemote(this.hoodie);
  //   });
  //   it("should set name to users database name", function() {
  //     return expect(this.remote.name).toBe("userhash123");
  //   });
  //   it("should be connected by default", function() {
  //     return expect(this.remote.isConnected()).toBeTruthy();
  //   });
  //   it("should connect", function() {
  //     return expect(Hoodie.AccountRemote.prototype.connect).wasCalled();
  //   });
  //   it("should subscribe to `reauthenticated` event", function() {
  //     var call, _i, _len, _ref;
  //     _ref = this.hoodie.on.calls;
  //     for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  //       call = _ref[_i];
  //       if (call.args[0] === 'account:reauthenticated') {
  //         call.args[1]();
  //       }
  //     }
  //     return expect(Hoodie.AccountRemote.prototype.connect).wasCalled();
  //   });
  //   it("should subscribe to `signout` event", function() {
  //     var call, _i, _len, _ref;
  //     _ref = this.hoodie.on.calls;
  //     for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  //       call = _ref[_i];
  //       if (call.args[0] === 'account:signout') {
  //         call.args[1]();
  //       }
  //     }
  //     return expect(Hoodie.AccountRemote.prototype.disconnect).wasCalled();
  //   });
  //   it("should set connected to true", function() {
  //     return expect(this.remote.isConnected()).toBe(true);
  //   });
  //   return it("should subscribe to `reconnected` event", function() {
  //     var call, _i, _len, _ref;
  //     _ref = this.hoodie.on.calls;
  //     for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  //       call = _ref[_i];
  //       if (call.args[0] === 'reconnected') {
  //         call.args[1]();
  //       }
  //     }
  //     return expect(Hoodie.AccountRemote.prototype.connect).wasCalled();
  //   });
  // });
  describe("#connect()", function() {
    beforeEach(function() {
      this.authenticateDefer = this.hoodie.defer();
      return spyOn(this.hoodie.account, "authenticate").andReturn(this.authenticateDefer.promise());
    });
    it("should authenticate", function() {
      this.remote.connect();
      return expect(this.hoodie.account.authenticate).wasCalled();
    });
    // return _when("successfully authenticated", function() {
    //   beforeEach(function() {
    //     return this.authenticateDefer.resolve();
    //   });
    //   it("should set connected to true", function() {
    //     this.remote.connected = false;
    //     this.remote.connect();
    //     return expect(this.remote.connected).toBe(true);
    //   });
    //   it("should subscribe to store:idle event", function() {
    //     this.remote.connect();
    //     return expect(this.hoodie.on).wasCalledWith('store:idle', this.remote.push);
    //   });
    //   return _and("user signs in, it should connect", function() {
    //     beforeEach(function() {
    //       this.remote.connected = false;
    //       spyOn(this.remote, "connect");
    //       return this.remote._handleSignIn();
    //     });
    //     return it("should connect", function() {
    //       return expect(this.remote.connected).toBe(true);
    //     });
    //   });
    // });
  });
  describe("#disconnect()", function() {
    it("should unsubscribe from stores's dirty idle event", function() {
      this.remote.disconnect();
      return expect(this.hoodie.unbind).wasCalledWith('store:idle', this.remote.push);
    });
    return it("should set connected to false", function() {
      this.remote.disconnect();
      return expect(this.remote.isConnected()).toBeFalsy();
    });
  });
  describe("#getSinceNr()", function() {
    beforeEach(function() {
      return spyOn(this.hoodie.config, "get");
    });
    it("should use user's config to get since nr", function() {
      this.remote.getSinceNr();
      return expect(this.hoodie.config.get).wasCalledWith('_remote.since');
    });
    return _when("config _remote.since is not defined", function() {
      beforeEach(function() {
        return this.hoodie.config.get.andReturn(void 0);
      });
      return it("should return 0", function() {
        return expect(this.remote.getSinceNr()).toBe(0);
      });
    });
  });
  describe("#setSinceNr(nr)", function() {
    beforeEach(function() {
      return spyOn(this.hoodie.config, "set");
    });
    return it("should use user's config to store since nr persistantly", function() {
      this.remote.setSinceNr(100);
      return expect(this.hoodie.config.set).wasCalledWith('_remote.since', 100);
    });
  });
  describe("#pull()", function() {
    beforeEach(function() {
      this.remote.connected = true;
      // spyOn(this.remote, "request").andReturn(this.requestDefer.promise());
      spyOn(this.remote, "request").andCallFake( function() {
        console.log('wtf?!');
        return this.requestDefer.promise();
      }.bind(this));
    });
    _when(".isConnected() is true", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isConnected").andReturn(true);
      });
      it("should send a longpoll GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request).wasCalled();
        // _ref = this.remote.request.mostRecentCall.args,
        // method = _ref[0],
        // path = _ref[1];
        // expect(method).toBe('GET');
        // return expect(path).toBe('/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll');
      });
      return it("should set a timeout to restart the pull request", function() {
        this.remote.pull();
        return expect(window.setTimeout).wasCalledWith(this.remote._restartPullRequest, 25000);
      });
    });
    _when(".isConnected() is false", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isConnected").andReturn(false);
      });
      return it("should send a normal GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request).wasCalled();
        _ref = this.remote.request.mostRecentCall.args,
        method = _ref[0],
        path = _ref[1];
        expect(method).toBe('GET');
        return expect(path).toBe('/_changes?include_docs=true&since=0');
      });
    });
    _when("request is successful / returns changes", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return success(Mocks.changesResponse());
          }
        });
      });
      return _and(".isConnected() returns true", function() {
        beforeEach(function() {
          spyOn(this.remote, "isConnected").andReturn(true);
          return spyOn(this.remote, "pull").andCallThrough();
        });
        return it("should pull again", function() {
          this.remote.pull();
          return expect(this.remote.pull.callCount).toBe(2);
        });
      });
    });
    _when("request errors with 401 unauthorzied", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 401
            }, 'error object');
          }
        });
        return spyOn(this.remote, "disconnect");
      });
      it("should disconnect", function() {
        this.remote.pull();
        return expect(this.remote.disconnect).wasCalled();
      });
      it("should trigger an unauthenticated error", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        return expect(this.remote.trigger).wasCalledWith('error:unauthenticated', 'error object');
      });
      _and("remote is pullContinuously", function() {
        return beforeEach(function() {
          this.remote.pullContinuously = true;
          return this.remote.pullContinuously;
        });
      });
      return _and("remote isn't pullContinuously", function() {
        return beforeEach(function() {
          this.remote.pullContinuously = false;
          return this.remote.pullContinuously;
        });
      });
    });
    _when("request errors with 401 unauthorzied", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 401
            }, 'error object');
          }
        });
        return spyOn(this.remote, "disconnect");
      });
      it("should disconnect", function() {
        this.remote.pull();
        return expect(this.remote.disconnect).wasCalled();
      });
      it("should trigger an unauthenticated error", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        return expect(this.remote.trigger).wasCalledWith('error:unauthenticated', 'error object');
      });
      _and("remote is pullContinuously", function() {
        return beforeEach(function() {
          this.remote.pullContinuously = true;
          return this.remote.pullContinuously;
        });
      });
      return _and("remote isn't pullContinuously", function() {
        return beforeEach(function() {
          this.remote.pullContinuously = false;
          return this.remote.pullContinuously;
        });
      });
    });
    _when("request errors with 404 not found", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 404
            }, 'error object');
          }
        });
      });
      return it("should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", function() {
        this.remote.pull();
        return expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
      });
    });
    _when("request errors with 500 oooops", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              status: 500
            }, 'error object');
          }
        });
      });
      it("should try again in 3 seconds (and hope it was only a hiccup ...)", function() {
        this.remote.pull();
        return expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
      });
      return it("should trigger a server error event", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        return expect(this.remote.trigger).wasCalledWith('error:server', 'error object');
      });
    });
    _when("request was aborted manually", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({
              statusText: 'abort'
            }, 'error object');
          }
        });
      });
      return it("should try again when .isConnected() returns true", function() {
        spyOn(this.remote, "pull").andCallThrough();
        spyOn(this.remote, "isConnected").andReturn(true);
        this.remote.pull();
        expect(this.remote.pull.callCount).toBe(2);
        this.remote.pull.reset();
        this.remote.isConnected.andReturn(false);
        this.remote.pull();
        return expect(this.remote.pull.callCount).toBe(1);
      });
    });
    return _when("there is a different error", function() {
      beforeEach(function() {
        var _this = this;
        return this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({}, 'error object');
          }
        });
      });
      return it("should try again in 3 seconds if .isConnected() returns false", function() {
        spyOn(this.remote, "isConnected").andReturn(true);
        this.remote.pull();
        expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
        window.setTimeout.reset();
        this.remote.isConnected.andReturn(false);
        this.remote.pull();
        return expect(window.setTimeout).wasNotCalledWith(this.remote.pull, 3000);
      });
    });
  });
  describe("#push(docs)", function() {
    beforeEach(function() {
      this.pushDefer = this.hoodie.defer();
      // return spyOn(Hoodie.Remote.prototype, "push").andReturn(this.pushDefer.promise());
    });
    _when("disconnected", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isConnected").andReturn(false);
      });
      return it("should reject with pushError", function() {
        var errorCalled, promise;
        promise = this.remote.push([
          {
            type: 'todo',
            id: '1'
          }
        ]);
        errorCalled = false;
        promise.fail(function(error) {
          var data, message, name;
          errorCalled = true;
          name = error.name,
          message = error.message,
          data = error.data;
          expect(name).toBe('ConnectionError');
          return expect(message).toBe('Not connected: could not push local changes to remote');
        });
        return expect(errorCalled).toBeTruthy();
      });
    });
    return _when("connected", function() {
      beforeEach(function() {
        return spyOn(this.remote, "isConnected").andReturn(true);
      });
      // _and("no docs passed", function() {
      //   return it("should push changed documents from store", function() {
      //     spyOn(this.hoodie.store, "changedObjects").andReturn(['changedDoc']);
      //     this.remote.push();
      //     return expect(Hoodie.Remote.prototype.push).wasCalledWith(['changedDoc']);
      //   });
      // });
      return _and("push fails", function() {
        beforeEach(function() {
          return this.pushDefer.reject();
        });
        return it("should check connection", function() {
          this.remote.push();
          return expect(this.hoodie.checkConnection).wasCalled();
        });
      });
    });
  });
  describe("#on", function() {
    it("should namespace bindings with 'remote'", function() {
      this.remote.on('funk', 'check');
      return expect(this.hoodie.on).wasCalledWith('remote:funk', 'check');
    });
    return it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.on('super funky fresh', cb);
      return expect(this.hoodie.on).wasCalledWith('remote:super remote:funky remote:fresh', cb);
    });
  });
  describe("#one", function() {
    it("should namespace bindings with 'remote'", function() {
      this.remote.one('funk', 'check');
      return expect(this.hoodie.one).wasCalledWith('remote:funk', 'check');
    });
    return it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.one('super funky fresh', cb);
      return expect(this.hoodie.one).wasCalledWith('remote:super remote:funky remote:fresh', cb);
    });
  });
  return describe("#trigger", function() {
    return it("should namespace bindings with 'remote'", function() {
      this.remote.trigger('funk', 'check');
      return expect(this.hoodie.trigger).wasCalledWith('remote:funk', 'check');
    });
  });
});

describe("Hoodie.Remote", function() {
  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie;
    spyOn(this.hoodie, "on");
    spyOn(this.hoodie, "trigger");
    spyOn(this.hoodie, "one");
    spyOn(this.hoodie, "unbind");
    spyOn(this.hoodie, "checkConnection");
    this.requestDefer = this.hoodie.defer();
    spyOn(window, "setTimeout");
    spyOn(this.hoodie.account, "db").andReturn('joe$example.com');
    this.remote = hoodieRemoteBase(this.hoodie, {
      name: 'remotetest'
    });
    spyOn(this.remote, "request").andReturn(this.requestDefer.promise());
  });
  // describe("constructor(@hoodie, options = {})", function() {
  //   beforeEach(function() {
  //     spyOn(Hoodie.Remote.prototype, "connect");
  //   });
  //   it("should set @name from options", function() {
  //     var remote;
  //     remote = new Hoodie.Remote(this.hoodie, {
  //       name: 'base/path'
  //     });
  //     expect(remote.name).toBe('base/path');
  //   });
  //   it("should default connected to false", function() {
  //     var remote;
  //     remote = new Hoodie.Remote(this.hoodie);
  //     expect(remote.connected).toBe(false);
  //   });
  //   it("should fallback prefix to ''", function() {
  //     var remote;
  //     remote = new Hoodie.Remote(this.hoodie);
  //     expect(remote.prefix).toBe('');
  //   });
  //   _when("connected: true passed", function() {
  //     beforeEach(function() {
  //       this.remote = new Hoodie.Remote(this.hoodie, {
  //         connected: true
  //       });
  //     });
  //     it("should set @connected to true", function() {
  //       expect(this.remote.connected).toBe(true);
  //     });
  //     it("should start syncing", function() {
  //       expect(Hoodie.Remote.prototype.connect).wasCalled();
  //     });
  //   });
  //   _when("prefix: $public passed", function() {
  //     beforeEach(function() {
  //       this.remote = new Hoodie.Remote(this.hoodie, {
  //         prefix: '$public'
  //       });
  //     });
  //     it("should set prefix accordingly", function() {
  //       expect(this.remote.prefix).toBe('$public');
  //     });
  //   });
  //   _when("baseUrl: http://api.otherapp.com passed", function() {
  //     beforeEach(function() {
  //       this.remote = new Hoodie.Remote(this.hoodie, {
  //         baseUrl: 'http://api.otherapp.com'
  //       });
  //     });
  //     it("should set baseUrl accordingly", function() {
  //       expect(this.remote.baseUrl).toBe('http://api.otherapp.com');
  //     });
  //   });
  // });
  describe("#request(type, path, options)", function() {
    beforeEach(function() {
      this.remote.request.andCallThrough();
      delete this.remote.name;
      spyOn(this.hoodie, "request");
    });
    it("should proxy to hoodie.request", function() {
      this.hoodie.request.andReturn('funk');
      returnedValue = this.remote.request("GET", "/something");
      expect(this.hoodie.request).wasCalled();
      expect(returnedValue).toEqual('funk');
    });
    it("should set options.contentType to 'application/json'", function() {
      this.remote.request("GET", "/something");
      expect(this.hoodie.request).wasCalledWith("GET", "/something", {
        contentType: 'application/json'
      });
    });
    it("should prefix path with @name (encoded)", function() {
      var path, type, _ref;
      this.remote.name = "my/store";
      this.remote.request("GET", "/something");
      _ref = this.hoodie.request.mostRecentCall.args, type = _ref[0], path = _ref[1];
      expect(path).toBe('/my%2Fstore/something');
    });
    it("should prefix path with @baseUrl", function() {
      var path, type, _ref;
      this.remote.baseUrl = 'http://api.otherapp.com';
      this.remote.request("GET", "/something");
      _ref = this.hoodie.request.mostRecentCall.args, type = _ref[0], path = _ref[1];
      expect(path).toBe('http://api.otherapp.com/something');
    });
    _when("type is POST", function() {
      beforeEach(function() {
        var path, type, _ref;
        this.remote.request("POST", "/something");
        _ref = this.hoodie.request.mostRecentCall.args, type = _ref[0], path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should default options.dataType to 'json'", function() {
        expect(this.options.dataType).toBe('json');
      });
      it("should default options.dataType to 'json'", function() {
        expect(this.options.processData).toBe(false);
      });
    });
  });
  describe("get(view, params)", function() {});
  describe("post(view, params)", function() {});
  describe("#find(type, id)", function() {
    it("should send a GET request to `/type%2Fid`", function() {
      var path, type, _ref;
      this.remote.find('car', '123');
      _ref = this.remote.request.mostRecentCall.args, type = _ref[0], path = _ref[1];
      expect(type).toBe('GET');
      expect(path).toBe('/car%2F123');
    });
    _when("prefix is store_prefix/", function() {
      beforeEach(function() {
        this.remote.prefix = 'store_prefix/';
      });
      it("should send request to `store_prefix%2Ftype%2Fid`", function() {
        var path, type, _ref;
        this.remote.find('car', '123');
        _ref = this.remote.request.mostRecentCall.args, type = _ref[0], path = _ref[1];
        expect(type).toBe('GET');
        expect(path).toBe('/store_prefix%2Fcar%2F123');
      });
      _and("request successful", function() {
        beforeEach(function() {
          this.requestDefer.resolve({
            _id: 'store_prefix/car/fresh',
            createdAt: '2012-12-12T22:00:00.000Z',
            updatedAt: '2012-12-21T22:00:00.000Z'
          });
        });
        it("should resolve with the doc", function() {
          expect(this.remote.find("todo", "1")).toBeResolvedWith({
            id: 'fresh',
            type: 'car',
            createdAt: '2012-12-12T22:00:00.000Z',
            updatedAt: '2012-12-21T22:00:00.000Z'
          });
        });
      });
    });
  });
  describe("#findAll(type)", function() {
    it("should return a promise", function() {
      expect(this.remote.findAll()).toBePromise();
    });
    _when("type is not set", function() {
      _and("prefix is empty", function() {
        beforeEach(function() {
          this.remote.prefix = '';
        });
        it("should send a GET to /_all_docs?include_docs=true", function() {
          this.remote.findAll();
          expect(this.remote.request).wasCalledWith("GET", "/_all_docs?include_docs=true");
        });
      });
      _and("prefix is '$public'", function() {
        beforeEach(function() {
          this.remote.prefix = '$public/';
        });
        it("should send a GET to /_all_docs?include_docs=true&startkey=\"$public/\"&endkey=\"$public0\"", function() {
          this.remote.findAll();
          expect(this.remote.request).wasCalledWith("GET", '/_all_docs?include_docs=true&startkey="%24public%2F"&endkey="%24public0"');
        });
      });
    });
    _when("type is todo", function() {
      it('should send a GET to /_all_docs?include_docs=true&startkey="todo/"&endkey="todo0"', function() {
        this.remote.findAll('todo');
        expect(this.remote.request).wasCalledWith("GET", '/_all_docs?include_docs=true&startkey="todo%2F"&endkey="todo0"');
      });
      _and("prefix is 'remote_prefix'", function() {
        beforeEach(function() {
          this.remote.prefix = 'remote_prefix/';
        });
        it('should send a GET to /_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"', function() {
          this.remote.findAll('todo');
          expect(this.remote.request).wasCalledWith("GET", '/_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"');
        });
      });
    });
    _when("request success", function() {
      beforeEach(function() {
        this.doc = {
          _id: 'car/fresh',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        };
        this.requestDefer.resolve({
          total_rows: 3,
          offset: 0,
          rows: [
            {
              doc: this.doc
            }
          ]
        });
      });
      it("should be resolved with array of objects", function() {
        var object;
        object = {
          id: 'fresh',
          type: 'car',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        };
        expect(this.remote.findAll()).toBeResolvedWith([object]);
      });
    });
    _when("request has an error", function() {
      beforeEach(function() {
        this.requestDefer.reject("error");
      });
      it("should be rejected with the response error", function() {
        var promise;
        promise = this.remote.findAll();
        expect(promise).toBeRejectedWith("error");
      });
    });
  });
  describe("#save(type, id, object)", function() {
    beforeEach(function() {
      spyOn(this.hoodie, "uuid").andReturn("uuid567");
    });
    it("should generate an id if it is undefined", function() {
      this.remote.save("car", void 0, {});
      expect(this.hoodie.uuid).wasCalled();
    });
    // it("should not generate an id if id is set", function() {
    //   spyOn(this.remote, "_generateNewRevisionId").andReturn('newRevId');
    //   this.remote.save("car", 123, {});
    //   expect(this.hoodie.uuid).wasNotCalled();
    // });
    it("should return promise by @request", function() {
      this.remote.request.andReturn('request_promise');
      expect(this.remote.save("car", 123, {})).toBe('request_promise');
    });
    _when("saving car/123 with color: red", function() {
      beforeEach(function() {
        var _ref, _ref1;
        this.remote.save("car", 123, {
          color: "red"
        });
        _ref = this.remote.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], (_ref1 = _ref[2], this.data = _ref1.data), _ref;
      });
      it("should send a PUT request to `/car%2F123`", function() {
        expect(this.type).toBe('PUT');
        expect(this.path).toBe('/car%2F123');
      });
      it("should add type to saved object", function() {
        expect(this.data.type).toBe('car');
      });
      it("should set _id to `car/123`", function() {
        expect(this.data._id).toBe('car/123');
      });
      it("should not generate a _rev", function() {
        expect(this.data._rev).toBeUndefined();
      });
    });
    _when("saving car/123 with color: red and prefix is 'remote_prefix'", function() {
      beforeEach(function() {
        var _ref, _ref1;
        this.remote.prefix = 'remote_prefix/';
        this.remote.save("car", 123, {
          color: "red"
        });
        _ref = this.remote.request.mostRecentCall.args, this.type = _ref[0], this.path = _ref[1], (_ref1 = _ref[2], this.data = _ref1.data), _ref;
      });
      it("should send a PUT request to `/remote_prefix%2Fcar%2F123`", function() {
        expect(this.type).toBe('PUT');
        expect(this.path).toBe('/remote_prefix%2Fcar%2F123');
      });
      it("should set _id to `remote_prefix/car/123`", function() {
        expect(this.data._id).toBe('remote_prefix/car/123');
      });
    });
  });
  describe("#remove(type, id)", function() {
    beforeEach(function() {
      spyOn(this.remote, "update").andReturn("update_promise");
    });
    it("should proxy to update with _deleted: true", function() {
      this.remote.remove('car', 123);
      expect(this.remote.update).wasCalledWith('car', 123, {
        _deleted: true
      });
    });
    it("should return promise of update", function() {
      expect(this.remote.remove('car', 123)).toBe('update_promise');
    });
  });
  describe("#removeAll(type)", function() {
    beforeEach(function() {
      spyOn(this.remote, "updateAll").andReturn("updateAll_promise");
    });
    it("should proxy to updateAll with _deleted: true", function() {
      this.remote.removeAll('car');
      expect(this.remote.updateAll).wasCalledWith('car', {
        _deleted: true
      });
    });
    it("should return promise of updateAll", function() {
      expect(this.remote.removeAll('car')).toBe('updateAll_promise');
    });
  });
  describe("#connect()", function() {
    beforeEach(function() {
      spyOn(this.remote, "bootstrap");
    });
    it("should set connected to true", function() {
      this.remote.connected = false;
      this.remote.connect();
      expect(this.remote.connected).toBe(true);
    });
    it("should bootstrap", function() {
      this.remote.connect();
      expect(this.remote.bootstrap).wasCalled();
    });
  });
  // describe("#disconnect()", function() {
  //   it("should not fail when there are no running requests", function() {
  //     this.remote._pullRequest = undefined
  //     this.remote._pushRequest = undefined
  //     expect( this.remote.disconnect ).not.toThrow()
  //   });
  //   it("should abort the pull request", function() {
  //     this.remote._pullRequest = {
  //       abort: jasmine.createSpy('pull')
  //     };
  //     this.remote.disconnect();
  //     expect(this.remote._pullRequest.abort).wasCalled();
  //   });
  //   it("should abort the push request", function() {
  //     this.remote._pushRequest = {
  //       abort: jasmine.createSpy('push')
  //     };
  //     this.remote.disconnect();
  //     expect(this.remote._pushRequest.abort).wasCalled();
  //   });
  // });
  describe("#getSinceNr()", function() {
    _when("since not set before", function() {
      it("should return 0", function() {
        expect(this.remote._since).toBe(void 0);
        expect(this.remote.getSinceNr()).toBe(0);
      });
    });
    _when("since set to 100 before", function() {
      beforeEach(function() {
        this.remote.setSinceNr(100);
      });
      it("should return 100", function() {
        expect(this.remote.getSinceNr()).toBe(100);
      });
    });
  });
  // describe("#setSinceNr(since)", function() {
  //   it("should set _since property", function() {
  //     expect(this.remote._since).toBe(void 0);
  //     this.remote.setSinceNr(100);
  //     expect(this.remote._since).toBe(100);
  //   });
  // });
  describe("#bootstrap()", function() {
    beforeEach(function() {
      this.bootstrapDefer = this.hoodie.defer();
      spyOn(this.remote, "pull").andReturn( this.bootstrapDefer );
      spyOn(this.remote, "trigger");
    });

    it("should trigger bootstrap:start event", function() {
      this.remote.bootstrap()
      expect(this.remote.trigger).wasCalledWith('bootstrap:start');
    });

    it("should pull", function() {
      this.remote.bootstrap()
      expect(this.remote.pull).wasCalled();
    });

    _when("bootstrap succeeds", function() {
      beforeEach(function() {
        this.bootstrapDefer.resolve()
      });

      it("should trigger 'bootstrap:end' event", function() {
        this.remote.bootstrap()
        expect(this.remote.trigger).wasCalledWith('bootstrap:end');
      });
    });
  });
  describe("#pull()", function() {
    beforeEach(function() {
      this.remote.connected = true;
      this.object1 = {
        type: 'todo',
        id: 'abc3',
        _rev: '2-123',
        _deleted: true
      };
      this.object2 = {
        type: 'todo',
        id: 'abc2',
        _rev: '1-123',
        content: 'remember the milk',
        done: false,
        order: 1
      };
      this.object3 = {
        type: 'todo',
        id: 'abc4',
        _rev: '4-123',
        content: 'I am prefixed yo.',
        done: false,
        order: 2
      };
      this.object4 = {
        id: "abc5",
        type: "todo",
        _rev: "5-123",
        content: "deleted, but unknown",
        _deleted: true
      };
    });
    _when(".isConnected() is true", function() {
      beforeEach(function() {
        spyOn(this.remote, "isConnected").andReturn(true);
      });
      it("should send a longpoll GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request).wasCalled();
        _ref = this.remote.request.mostRecentCall.args, method = _ref[0], path = _ref[1];
        expect(method).toBe('GET');
        expect(path).toBe('/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll');
      });
      // it("should set a timeout to restart the pull request", function() {
      //   this.remote.pull();
      //   expect(window.setTimeout).wasCalledWith(this.remote._restartPullRequest, 25000);
      // });
    });
    _when(".isConnected() is false", function() {
      beforeEach(function() {
        spyOn(this.remote, "isConnected").andReturn(false);
      });
      it("should send a normal GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request).wasCalled();
        _ref = this.remote.request.mostRecentCall.args, method = _ref[0], path = _ref[1];
        expect(method).toBe('GET');
        expect(path).toBe('/_changes?include_docs=true&since=0');
      });
    });
    _when("request is successful / returns changes", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            success(Mocks.changesResponse());
          }
        });
      });
      it("should trigger remote events", function() {
        spyOn(this.remote, "trigger");
        spyOn(this.remote, "isKnownObject").andCallFake(function(object) {
          return object.id === 'abc3';
        });
        this.remote.pull();
        expect(this.remote.trigger).wasCalledWith('remove', this.object1);
        expect(this.remote.trigger).wasCalledWith('remove:todo', this.object1);
        expect(this.remote.trigger).wasCalledWith('remove:todo:abc3', this.object1);
        expect(this.remote.trigger).wasCalledWith('change', 'remove', this.object1);
        expect(this.remote.trigger).wasCalledWith('change:todo', 'remove', this.object1);
        expect(this.remote.trigger).wasCalledWith('change:todo:abc3', 'remove', this.object1);
        expect(this.remote.trigger).wasCalledWith('add', this.object2);
        expect(this.remote.trigger).wasCalledWith('add:todo', this.object2);
        expect(this.remote.trigger).wasCalledWith('add:todo:abc2', this.object2);
        expect(this.remote.trigger).wasCalledWith('change', 'add', this.object2);
        expect(this.remote.trigger).wasCalledWith('change:todo', 'add', this.object2);
        expect(this.remote.trigger).wasCalledWith('change:todo:abc2', 'add', this.object2);
        expect(this.remote.trigger).wasNotCalledWith('remove:todo:abc5', this.object4);
      });
      _and(".isConnected() returns true", function() {
        beforeEach(function() {
          spyOn(this.remote, "isConnected").andReturn(true);
          spyOn(this.remote, "pull").andCallThrough();
        });
        it("should pull again", function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).toBe(2);
        });
      });
      _and("prefix is set", function() {
        beforeEach(function() {
          this.remote.prefix = 'prefix/';
        });
        it("should trigger events only for objects with prefix", function() {
          spyOn(this.remote, "trigger");
          this.remote.pull();
          expect(this.remote.trigger).wasCalledWith('add', this.object3);
          expect(this.remote.trigger).wasNotCalledWith('add', this.object2);
        });
      });
      _and("object has been returned before", function() {
        beforeEach(function() {
          spyOn(this.remote, "isKnownObject").andReturn(true);
          spyOn(this.remote, "trigger");
          this.remote.pull();
        });
        it("should trigger update events", function() {
          var object;
          object = {
            'type': 'todo',
            id: 'abc2',
            _rev: '1-123',
            content: 'remember the milk',
            done: false,
            order: 1
          };
          expect(this.remote.trigger).wasCalledWith('update', object);
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
            error({
              status: 401
            }, 'error object');
          }
        });
        spyOn(this.remote, "disconnect");
      });
      it("should disconnect", function() {
        this.remote.pull();
        expect(this.remote.disconnect).wasCalled();
      });
      it("should trigger an unauthenticated error", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        expect(this.remote.trigger).wasCalledWith('error:unauthenticated', 'error object');
      });
    });
    _when("request errors with 404 not found", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            error({
              status: 404
            }, 'error object');
          }
        });
      });
      it("should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", function() {
        this.remote.pull();
        expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
      });
    });
    _when("request errors with 500 oooops", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            error({
              status: 500
            }, 'error object');
          }
        });
      });
      it("should try again in 3 seconds (and hope it was only a hiccup ...)", function() {
        this.remote.pull();
        expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
      });
      it("should trigger a server error event", function() {
        spyOn(this.remote, "trigger");
        this.remote.pull();
        expect(this.remote.trigger).wasCalledWith('error:server', 'error object');
      });
      it("should check connection", function() {
        this.remote.pull();
        expect(this.hoodie.checkConnection).wasCalled();
      });
    });
    _when("request was aborted manually", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            error({
              statusText: 'abort'
            }, 'error object');
          }
        });
        spyOn(this.remote, "pull").andCallThrough();
      });
      _and("is connected", function() {
        beforeEach(function() {
          spyOn(this.remote, "isConnected").andReturn(true);
        });
        it("should pull again", function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).toBe(2);
        });
      });
      _and("is not connected", function() {
        beforeEach(function() {
          spyOn(this.remote, "isConnected").andReturn(false);
        });
        it("should not pull again", function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).toBe(1);
        });
      });
    });
    _when("there is a different error", function() {
      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            error({}, 'error object');
          }
        });
      });
      it("should try again in 3 seconds if .isConnected() returns false", function() {
        spyOn(this.remote, "isConnected").andReturn(true);
        this.remote.pull();
        expect(window.setTimeout).wasCalledWith(this.remote.pull, 3000);
        window.setTimeout.reset();
        this.remote.isConnected.andReturn(false);
        this.remote.pull();
        expect(window.setTimeout).wasNotCalledWith(this.remote.pull, 3000);
      });
      it("should check connection", function() {
        this.remote.pull();
        expect(this.hoodie.checkConnection).wasCalled();
      });
    });
  });
  describe("#push(docs)", function() {
    beforeEach(function() {
      spyOn(Date, "now").andReturn(10);
      this.remote._timezoneOffset = 1;
    });
    _when("no docs passed", function() {
      it("shouldn't do anything", function() {
        this.remote.push();
        this.remote.push([]);
        expect(this.remote.request).wasNotCalled();
      });
    });
    _and("Array of docs passed", function() {
      beforeEach(function() {
        this.todoObjects = [
          {
            type: 'todo',
            id: '1'
          }, {
            type: 'todo',
            id: '2'
          }, {
            type: 'todo',
            id: '3'
          }
        ];
        this.promise = this.remote.push(this.todoObjects);
      });
      it("should return a promise", function() {
        expect(this.promise).toBePromise()
      });
      it("should POST the passed objects", function() {
        var data;
        expect(this.remote.request).wasCalled();
        data = this.remote.request.mostRecentCall.args[2].data;
        expect(data.docs.length).toBe(3);
      });
    });
    _and("one deleted and one new doc passed", function() {
      beforeEach(function() {
        var _ref;
        this.remote.push(Mocks.changedObjects());
        expect(this.remote.request).wasCalled();
        _ref = this.remote.request.mostRecentCall.args, this.method = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
      });
      it("should post the changes to the user's db _bulk_docs API", function() {
        expect(this.method).toBe('POST');
        expect(this.path).toBe('/_bulk_docs');
      });
      it("should send the docs in appropriate format", function() {
        var doc, docs;
        docs = this.options.data.docs;
        doc = docs[0];
        expect(doc.id).toBeUndefined();
        expect(doc._id).toBe('todo/abc3');
        expect(doc._localInfo).toBeUndefined();
      });
      it("should set data.new_edits to false", function() {
        var new_edits;
        new_edits = this.options.data.new_edits;
        expect(new_edits).toBe(false);
      });
      it("should set new _revision ids", function() {
        var deletedDoc, docs, newDoc;
        docs = this.options.data.docs;
        deletedDoc = docs[0], newDoc = docs[1];
        expect(deletedDoc._rev).toBe('3-uuid');
        expect(newDoc._rev).toMatch('1-uuid');
        expect(deletedDoc._revisions.start).toBe(3);
        expect(deletedDoc._revisions.ids[0]).toBe('uuid');
        expect(deletedDoc._revisions.ids[1]).toBe('123');
        expect(newDoc._revisions.start).toBe(1);
        expect(newDoc._revisions.ids[0]).toBe('uuid');
      });
    });
    _and("prefix set to $public", function() {
      beforeEach(function() {
        this.remote.prefix = '$public/';
        this.todoObjects = [
          {
            type: 'todo',
            id: '1'
          }, {
            type: 'todo',
            id: '2'
          }, {
            type: 'todo',
            id: '3'
          }
        ];
        this.remote.push(this.todoObjects);
      });
      it("should prefix all document IDs with '$public/'", function() {
        var data;
        expect(this.remote.request).wasCalled();
        data = this.remote.request.mostRecentCall.args[2].data;
        expect(data.docs[0]._id).toBe('$public/todo/1');
      });
    });
    _and("_$local flags set", function() {
      beforeEach(function() {
        this.remote.prefix = '$public/';
        this.todoObjects = [
          {
            type: 'todo',
            id: '1'
          }, {
            type: 'todo',
            id: '2',
            _$local: true
          }
        ];
        this.remote.push(this.todoObjects);
      });
      it("should add `-local` suffix to rev number", function() {
        var data;
        expect(this.remote.request).wasCalled();
        data = this.remote.request.mostRecentCall.args[2].data;
        expect(data.docs[0]._rev).toBe('1-uuid');
        expect(data.docs[1]._rev).toBe('1-uuid-local');
      });
    });
  });
  describe("#sync(docs)", function() {
    beforeEach(function() {
      spyOn(this.remote, "push").andCallFake(function(docs) {
        return {
          pipe: function(cb) {
            cb(docs);
          }
        };
      });
      spyOn(this.remote, "pull");
    });
    it("should push changes and pass arguments", function() {
      this.remote.sync([1, 2, 3]);
      expect(this.remote.push).wasCalledWith([1, 2, 3]);
    });
    it("should pull changes and pass arguments", function() {
      this.remote.sync([1, 2, 3]);
      expect(this.remote.pull).wasCalledWith([1, 2, 3]);
    });
  });
  describe("#on(event, callback)", function() {
    it("should namespace events with `name`", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.name = 'databaseName';
      this.remote.on('funky', cb);
      expect(this.hoodie.on).wasCalledWith('databaseName:funky', cb);
    });
    it("should namespace multiple events correctly", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.name = 'databaseName';
      this.remote.on('super funky fresh', cb);
      expect(this.hoodie.on).wasCalledWith('databaseName:super databaseName:funky databaseName:fresh', cb);
    });
  });
  describe("#trigger(event, parameters...)", function() {
    it("should namespace events with `name`", function() {
      var cb;
      cb = jasmine.createSpy('test');
      this.remote.name = 'databaseName';
      this.remote.trigger('funky', cb);
      expect(this.hoodie.trigger).wasCalledWith('databaseName:funky', cb);
    });
  });
});

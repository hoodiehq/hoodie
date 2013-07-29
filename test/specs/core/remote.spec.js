'use strict';

describe("Hoodie.Remote", function() {

  beforeEach(function() {

    this.hoodie = new Mocks.Hoodie();

    this.sandbox = sinon.sandbox.create();

    this.sandbox.spy(this.hoodie, 'on');
    this.sandbox.spy(this.hoodie, 'trigger');
    this.sandbox.spy(this.hoodie, 'one');
    this.sandbox.spy(this.hoodie, 'unbind');
    this.sandbox.spy(this.hoodie, 'checkConnection');

    this.sandbox.spy(window, 'setTimeout');

    this.requestDefer = this.hoodie.defer();

    this.sandbox.stub(this.hoodie.account, 'db').returns('joe$example.com');

    this.remote = new Hoodie.Remote(this.hoodie);
    this.remote.name = 'remotetest';

    this.sandbox.stub(this.remote, 'request').returns(this.requestDefer.promise());

    this.sandbox.spy(Hoodie.Remote.prototype, 'connect');

  });

  afterEach(function () {
    this.sandbox.restore();
  });

  xdescribe("constructor(@hoodie, options = {})", function() {

    it("should set @name from options", function() {
      var remote = new Hoodie.Remote(this.hoodie, {
        name: 'base/path'
      });
      expect(remote.name).to.eql('base/path');
    });


    it("should default connected to false", function() {
      var remote = new Hoodie.Remote(this.hoodie);
      expect(remote.connected).to.eql(false);
    });

    it("should fallback prefix to ''", function() {
      var remote = new Hoodie.Remote(this.hoodie);
      expect(remote.prefix).to.eql('');
    });

    _when("connected: true passed", function() {

      beforeEach(function() {
        this.remote = new Hoodie.Remote(this.hoodie, {
          connected: true
        });
      });

      it("should set @connected to true", function() {
        expect(this.remote.connected).to.eql(true);
      });

      it("should start syncing", function() {
        expect(Hoodie.Remote.prototype.called).to.be.ok();
      });

    });

    _when("prefix: $public passed", function() {

      beforeEach(function() {
        this.remote = new Hoodie.Remote(this.hoodie, {
          prefix: '$public'
        });
      });

      it("should set prefix accordingly", function() {
        expect(this.remote.prefix).to.eql('$public');
      });
    });

    _when("baseUrl: http://api.otherapp.com passed", function() {

      beforeEach(function() {
        this.remote = new Hoodie.Remote(this.hoodie, {
          baseUrl: 'http://api.otherapp.com'
        });
      });

      it("should set baseUrl accordingly", function() {
        expect(this.remote.baseUrl).to.eql('http://api.otherapp.com');
      });
    });

  });

  xdescribe("#request(type, path, options)", function() {

    beforeEach(function() {
      this.remote.request();
      delete this.remote.name;
      this.sandbox.spy(this.hoodie, "request");
    });

    it("should proxy to hoodie.request", function() {
      var returnedValue;

      this.hoodie.request.returns('funk');
      returnedValue = this.remote.request("GET", "/something");

      expect(this.hoodie.request.called).to.be.ok();
      expect(returnedValue).to.eql('funk');
    });

    it("should set options.contentType to 'application/json'", function() {
      this.remote.request("GET", "/something");
      expect(this.hoodie.request.calledWith("GET", "/something", {
        contentType: 'application/json'
      })).to.be.ok();
    });

    it("should prefix path with @name (encoded)", function() {
      var path, type;
      this.remote.name = "my/store";
      this.remote.request("GET", "/something");
      var _ref = this.hoodie.request.args[0];

      type = _ref[0];
      path = _ref[1];

      expect(path).to.eql('/my%2Fstore/something');
    });

    it("should prefix path with @baseUrl", function() {
      var path, type;
      this.remote.baseUrl = 'http://api.otherapp.com';
      this.remote.request("GET", "/something");

      var _ref = this.hoodie.request.args[0];

      type = _ref[0];
      path = _ref[1];

      expect(path).to.eql('http://api.otherapp.com/something');
    });

    _when("type is POST", function() {

      beforeEach(function() {
        var path, type;
        this.remote.request("POST", "/something");
        var _ref = this.hoodie.request.args[0];

        type = _ref[0];
        path = _ref[1];
        this.options = _ref[2];
      });

      it("should default options.dataType to 'json'", function() {
        expect(this.options.dataType).to.eql('json');
      });

      it("should default options.dataType to 'json'", function() {
        expect(this.options.processData).to.eql(false);
      });

    });

  });

  describe("get(view, params)", function() {});

  describe("post(view, params)", function() {});

  describe("#find(type, id)", function() {

    it("should send a GET request to `/type%2Fid`", function() {
      var path, type;
      this.remote.find('car', '123');
      var _ref = this.remote.request.args[0];
      type = _ref[0],
      path = _ref[1];

      expect(type).to.eql('GET');
      expect(path).to.eql('/car%2F123');
    });

    _when("prefix is store_prefix/", function() {

      beforeEach(function() {
        this.remote.prefix = 'store_prefix/';
      });

      it("should send request to `store_prefix%2Ftype%2Fid`", function() {
        var path, type;
        this.remote.find('car', '123');
        var _ref = this.remote.request.args[0];

        type = _ref[0],
        path = _ref[1];

        expect(type).to.eql('GET');
        expect(path).to.eql('/store_prefix%2Fcar%2F123');
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

          this.remote.find('todo', '1').then(function (res) {
            expect(res).to.eql({
              id: 'fresh',
              type: 'car',
              createdAt: '2012-12-12T22:00:00.000Z',
              updatedAt: '2012-12-21T22:00:00.000Z'
            });
          });

        });

      });

    });

  });

  describe("#findAll(type)", function() {

    it("should return a promise", function() {
      expect(this.remote.findAll()).to.have.property('done');
      expect(this.remote.findAll()).to.not.have.property('resolved');
    });

    _when("type is not set", function() {

      _and("prefix is empty", function() {

        beforeEach(function() {
          this.remote.prefix = '';
        });

        it("should send a GET to /_all_docs?include_docs=true", function() {
          this.remote.findAll();
          expect(this.remote.request.calledWith("GET", "/_all_docs?include_docs=true")).to.be.ok();
        });

      });

      _and("prefix is '$public'", function() {

        beforeEach(function() {
          this.remote.prefix = '$public/';
        });

        it("should send a GET to /_all_docs?include_docs=true&startkey=\"$public/\"&endkey=\"$public0\"", function() {
          this.remote.findAll();
          expect(this.remote.request.calledWith("GET", '/_all_docs?include_docs=true&startkey="%24public%2F"&endkey="%24public0"')).to.be.ok();
        });

      });

    });

    _when("type is todo", function() {

      it('should send a GET to /_all_docs?include_docs=true&startkey="todo/"&endkey="todo0"', function() {
        this.remote.findAll('todo');
        expect(this.remote.request.calledWith("GET", '/_all_docs?include_docs=true&startkey="todo%2F"&endkey="todo0"')).to.be.ok();
      });

      _and("prefix is 'remote_prefix'", function() {

        beforeEach(function() {
          this.remote.prefix = 'remote_prefix/';
        });

        it('should send a GET to /_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"', function() {
          this.remote.findAll('todo');
          expect(this.remote.request.calledWith("GET", '/_all_docs?include_docs=true&startkey="remote_prefix%2Ftodo%2F"&endkey="remote_prefix%2Ftodo0"')).to.be.ok();
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
        var object = {
          id: 'fresh',
          type: 'car',
          createdAt: '2012-12-12T22:00:00.000Z',
          updatedAt: '2012-12-21T22:00:00.000Z'
        };
        this.remote.findAll().then(function (res) {
          expect(res).to.eql([object]);
        });
      });

    });

    _when("request has an error", function() {

      beforeEach(function() {
        this.requestDefer.reject("error");
      });

      it("should be rejected with the response error", function() {
        var promise = this.remote.findAll();
        promise.fail(function (res) {
          expect(res).to.eql("error");
        });
      });

    });

  });

  xdescribe("#save(type, id, object)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.hoodie, "uuid").returns("uuid567");
    });

    it("should generate an id if it is undefined", function() {
      this.remote.save("car", void 0, {});
      expect(this.hoodie.uuid.called).to.be.ok();
    });

    it("should not generate an id if id is set", function() {
      this.sandbox.stub(this.remote, "_generateNewRevisionId").returns('newRevId');
      this.remote.save("car", 123, {});

      expect(this.hoodie.uuid.called).to.not.be.ok();
    });

    it("should return promise by @request", function() {
      this.remote.request.returns('request_promise');
      expect(this.remote.save("car", 123, {})).to.eql('request_promise');
    });

    _when("saving car/123 with color: red", function() {

      beforeEach(function() {
        var _ref1;
        this.remote.save("car", 123, {
          color: "red"
        });
        var _ref = this.remote.request.args[0];
        this.type = _ref[0],
        this.path = _ref[1],
        (_ref1 = _ref[2],
         this.data = _ref1.data),
         _ref;
      });

      it("should send a PUT request to `/car%2F123`", function() {
        expect(this.type).to.eql('PUT');
        expect(this.path).to.eql('/car%2F123');
      });

      it("should add type to saved object", function() {
        expect(this.data.type).to.eql('car');
      });

      it("should set _id to `car/123`", function() {
        expect(this.data._id).to.eql('car/123');
      });

      it("should not generate a _rev", function() {
        expect(this.data._rev).to.be.undefined;
      });

    });

    _when("saving car/123 with color: red and prefix is 'remote_prefix'", function() {

      beforeEach(function() {
        var _ref, _ref1;
        this.remote.prefix = 'remote_prefix/';
        this.remote.save("car", 123, {
          color: "red"
        });
        _ref = this.remote.request.args[0], this.type = _ref[0], this.path = _ref[1], (_ref1 = _ref[2], this.data = _ref1.data), _ref;
      });

      it("should send a PUT request to `/remote_prefix%2Fcar%2F123`", function() {
        expect(this.type).to.eql('PUT');
        expect(this.path).to.eql('/remote_prefix%2Fcar%2F123');
      });

      it("should set _id to `remote_prefix/car/123`", function() {
        expect(this.data._id).to.eql('remote_prefix/car/123');
      });

    });

  });

  describe("#remove(type, id)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.remote, "update").returns("update_promise");
    });

    it("should proxy to update with _deleted: true", function() {
      this.remote.remove('car', 123);

      expect(this.remote.update.calledWith('car', 123, {
        _deleted: true
      })).to.be.ok();
    });

    it("should return promise of update", function() {
      expect(this.remote.remove('car', 123)).to.eql('update_promise');
    });

  });

  describe("#removeAll(type)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.remote, "updateAll").returns("updateAll_promise");
    });

    it("should proxy to updateAll with _deleted: true", function() {
      this.remote.removeAll('car');
      expect(this.remote.updateAll.calledWith('car', {
        _deleted: true
      })).to.be.ok();
    });

    it("should return promise of updateAll", function() {
      expect(this.remote.removeAll('car')).to.eql('updateAll_promise');
    });

  });

  describe("#connect()", function() {

    beforeEach(function() {
      this.sandbox.spy(this.remote, "bootstrap");
    });

    it("should set connected to true", function() {
      this.remote.connected = false;
      this.remote.connect();
      expect(this.remote.connected).to.eql(true);
    });

    it("should bootstrap", function() {
      this.remote.connect();
      expect(this.remote.bootstrap.called).to.be.ok();
    });

  });

  describe("#disconnect()", function() {

    //it("should not fail when there are no running requests", function() {
      //this.remote._pullRequest = undefined
      //this.remote._pushRequest = undefined
      //expect( this.remote.disconnect ).not.toThrow()
    //});

    it("should abort the pull request", function() {
      this.remote._pullRequest = {
        abort: this.sandbox.spy()
      };
      this.remote.disconnect();
      expect(this.remote._pullRequest.abort.called).to.be.ok();
    });

    it("should abort the push request", function() {
      this.remote._pushRequest = {
        abort: this.sandbox.spy()
      };
      this.remote.disconnect();
      expect(this.remote._pushRequest.abort.called).to.be.ok();
    });

  });

  describe("#getSinceNr()", function() {

    _when("since not set before", function() {

      it("should return 0", function() {
        expect(this.remote._since).to.eql(void 0);
        expect(this.remote.getSinceNr()).to.eql(0);
      });

    });

    _when("since set to 100 before", function() {

      beforeEach(function() {
        this.remote.setSinceNr(100);
      });

      it("should return 100", function() {
        expect(this.remote.getSinceNr()).to.eql(100);
      });

    });

  });

  describe("#setSinceNr(since)", function() {
    it("should set _since property", function() {
      expect(this.remote._since).to.eql(void 0);
      this.remote.setSinceNr(100);
      expect(this.remote._since).to.eql(100);
    });
  });

  describe("#bootstrap()", function() {

    beforeEach(function() {
      this.bootstrapDefer = this.hoodie.defer();
      this.sandbox.stub(this.remote, "pull").returns( this.bootstrapDefer );
      this.sandbox.spy(this.remote, "trigger");
    });

    it("should trigger bootstrap:start event", function() {
      this.remote.bootstrap()
      expect(this.remote.trigger.calledWith('bootstrap:start')).to.be.ok();
    });

    it("should pull", function() {
      this.remote.bootstrap()
      expect(this.remote.pull.called).to.be.ok();
    });

    _when("bootstrap succeeds", function() {

      beforeEach(function() {
        this.bootstrapDefer.resolve()
      });

      it("should trigger 'bootstrap:end' event", function() {
        this.remote.bootstrap()
        expect(this.remote.trigger.calledWith('bootstrap:end')).to.be.ok();
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
        this.sandbox.stub(this.remote, "isConnected").returns(true);
      });

      it("should send a longpoll GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request.called).to.be.ok();

        _ref = this.remote.request.args[0], method = _ref[0], path = _ref[1];
        expect(method).to.eql('GET');
        expect(path).to.eql('/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll');
      });

      it("should set a timeout to restart the pull request", function() {
        this.remote.pull();
        expect(window.setTimeout.calledWith(this.remote._restartPullRequest, 25000)).to.be.ok();
      });

    });

    _when(".isConnected() is false", function() {

      beforeEach(function() {
        this.sandbox.stub(this.remote, "isConnected").returns(false);
      });

      it("should send a normal GET request to the _changes feed", function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request.called).to.be.ok();
        _ref = this.remote.request.args[0], method = _ref[0], path = _ref[1];
        expect(method).to.eql('GET');
        expect(path).to.eql('/_changes?include_docs=true&since=0');
      });

    });

    _when("request is successful / returns changes", function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.returns({
          then: function(success) {
            _this.remote.request.returns({
              then: function() {}
            });
            success(Mocks.changesResponse());
          }
        });
      });

      xit("should trigger remote events", function() {
        this.sandbox.spy(this.remote, "trigger");
        this.sandbox.spy(this.remote, "isKnownObject").returns(function(object) {
          return object.id === 'abc3';
        });

        this.remote.pull();

        expect(this.remote.trigger.calledWith('remove', this.object1)).to.be.ok();
        expect(this.remote.trigger.calledWith('remove:todo', this.object1)).to.be.ok();
        expect(this.remote.trigger.calledWith('remove:todo:abc3', this.object1)).to.be.ok();
        expect(this.remote.trigger.calledWith('change', 'remove', this.object1)).to.be.ok();
        expect(this.remote.trigger.calledWith('change:todo', 'remove', this.object1)).to.be.ok();
        expect(this.remote.trigger.calledWith('change:todo:abc3', 'remove', this.object1)).to.be.ok();
        expect(this.remote.trigger.calledWith('add', this.object2)).to.be.ok();
        expect(this.remote.trigger.calledWith('add:todo', this.object2)).to.be.ok();
        expect(this.remote.trigger.calledWith('add:todo:abc2', this.object2)).to.be.ok();
        expect(this.remote.trigger.calledWith('change', 'add', this.object2)).to.be.ok();
        expect(this.remote.trigger.calledWith('change:todo', 'add', this.object2)).to.be.ok();
        expect(this.remote.trigger.calledWith('change:todo:abc2', 'add', this.object2)).to.be.ok();
        expect(this.remote.trigger.calledWith('remove:todo:abc5', this.object4)).to.not.be.ok();
      });

      _and(".isConnected() returns true", function() {

        beforeEach(function() {
          this.sandbox.stub(this.remote, "isConnected").returns(true);
          this.sandbox.stub(this.remote, "pull");
        });

        xit("should pull again", function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).to.eql(2);
        });

      });

      _and("prefix is set", function() {

        beforeEach(function() {
          this.remote.prefix = 'prefix/';
        });

        it("should trigger events only for objects with prefix", function() {
          this.sandbox.spy(this.remote, "trigger");
          this.remote.pull();
          expect(this.remote.trigger.calledWith('add', this.object3)).to.be.ok();
          expect(this.remote.trigger.calledWith('add', this.object2)).to.not.be.ok();
        });

      });

      _and("object has been returned before", function() {

        beforeEach(function() {
          this.sandbox.stub(this.remote, "isKnownObject").returns(true);
          this.sandbox.spy(this.remote, "trigger");
          this.remote.pull();
        });

        it("should trigger update events", function() {
          var object = {
            'type': 'todo',
            id: 'abc2',
            _rev: '1-123',
            content: 'remember the milk',
            done: false,
            order: 1
          };
          expect(this.remote.trigger.calledWith('update', object)).to.be.ok();
        });

      });

    });

    _when("request errors with 401 unauthorzied", function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.returns({
          then: function(success, error) {
            _this.remote.request.returns({
              then: function() {}
            });
            error({
              status: 401
            }, 'error object');
          }
        });

        this.sandbox.spy(this.remote, "disconnect");
      });

      it("should disconnect", function() {
        this.remote.pull();
        expect(this.remote.disconnect.called).to.be.ok();
      });

      it("should trigger an unauthenticated error", function() {
        this.sandbox.spy(this.remote, "trigger");
        this.remote.pull();
        expect(this.remote.trigger.calledWith('error:unauthenticated', 'error object')).to.be.ok();
      });

    });

    _when("request errors with 404 not found", function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.returns({
          then: function(success, error) {
            _this.remote.request.returns({
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
        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
      });

    });

    _when("request errors with 500 oooops", function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.returns({
          then: function(success, error) {
            _this.remote.request.returns({
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
        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
      });

      it("should trigger a server error event", function() {
        this.sandbox.spy(this.remote, "trigger");
        this.remote.pull();
        expect(this.remote.trigger.calledWith('error:server', 'error object')).to.be.ok();
      });

      it("should check connection", function() {
        this.remote.pull();
        expect(this.hoodie.checkConnection.called).to.be.ok();
      });

    });

    _when("request was aborted manually", function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.returns({
          then: function(success, error) {
            _this.remote.request.returns({
              then: function() {}
            });
            error({
              statusText: 'abort'
            }, 'error object');
          }
        });

        this.sandbox.stub(this.remote, "pull");
      });

      _and("is connected", function() {

        beforeEach(function() {
          this.sandbox.stub(this.remote, "isConnected").returns(true);
        });

        it("should pull again", function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).to.eql(2);
        });

      });

      _and("is not connected", function() {

        beforeEach(function() {
          this.sandbox.stub(this.remote, "isConnected").returns(false);
        });

        it("should not pull again", function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).to.eql(1);
        });

      });

    });

    _when("there is a different error", function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.returns({
          then: function(success, error) {
            _this.remote.request.returns({
              then: function() {}
            });
            error({}, 'error object');
          }
        });

      });

      it("should try again in 3 seconds if .isConnected() returns false", function() {

        this.sandbox.stub(this.remote, "isConnected").returns(true);

        this.remote.pull();

        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
        window.setTimeout.reset();
        this.remote.isConnected.returns(false);
        this.remote.pull();

        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.not.be.ok();
      });

      it("should check connection", function() {
        this.remote.pull();
        expect(this.hoodie.checkConnection.called).to.be.ok();
      });

    });

  });

  describe("#push(docs)", function() {

    beforeEach(function() {
      this.sandbox.stub(Date, "now").returns(10);
      this.remote._timezoneOffset = 1;
    });

    _when("no docs passed", function() {

      it("shouldn't do anything", function() {
        this.remote.push();
        this.remote.push([]);

        expect(this.remote.request.called).to.not.be.ok();
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
        expect(this.promise).to.have.property('done')
        expect(this.promise).to.not.have.property('resolved')
      });

      it("should POST the passed objects", function() {
        expect(this.remote.request).wasCalled();
        var data = this.remote.request.args[2].data;
        expect(data.docs.length).to.eql(3);
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
        expect(this.method).to.eql('POST');
        expect(this.path).to.eql('/_bulk_docs');
      });

      it("should send the docs in appropriate format", function() {
        var doc, docs;
        docs = this.options.data.docs;
        doc = docs[0];
        expect(doc.id).to.eqlUndefined();
        expect(doc._id).to.eql('todo/abc3');
        expect(doc._localInfo).to.be.undefined;
      });

      it("should set data.new_edits to false", function() {
        var new_edits;
        new_edits = this.options.data.new_edits;
        expect(new_edits).to.eql(false);
      });

      it("should set new _revision ids", function() {
        var deletedDoc, docs, newDoc;
        docs = this.options.data.docs;
        deletedDoc = docs[0], newDoc = docs[1];
        expect(deletedDoc._rev).to.eql('3-uuid');
        expect(newDoc._rev).toMatch('1-uuid');
        expect(deletedDoc._revisions.start).to.eql(3);
        expect(deletedDoc._revisions.ids[0]).to.eql('uuid');
        expect(deletedDoc._revisions.ids[1]).to.eql('123');
        expect(newDoc._revisions.start).to.eql(1);
        expect(newDoc._revisions.ids[0]).to.eql('uuid');
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
        expect(this.remote.request.called).to.be.ok();
        var data = this.remote.request.args[2].data;
        expect(data.docs[0]._id).to.eql('$public/todo/1');
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
        expect(this.remote.request).wasCalled();
        var data = this.remote.request.args[2].data;
        expect(data.docs[0]._rev).to.eql('1-uuid');
        expect(data.docs[1]._rev).to.eql('1-uuid-local');
      });

    });

  });

  describe("#sync(docs)", function() {

    beforeEach(function() {
      this.sandbox.stub(this.remote, "push").returns(function(docs) {
        return {
          pipe: function(cb) {
            cb(docs);
          }
        };
      });

      this.sandbox.spy(this.remote, "pull");
    });

    it("should push changes and pass arguments", function() {
      this.remote.sync([1, 2, 3]);
      expect(this.remote.push.calledWith([1, 2, 3])).to.be.ok();
    });

    it("should pull changes and pass arguments", function() {
      this.remote.sync([1, 2, 3]);
      expect(this.remote.pull.calledWith([1, 2, 3])).to.be.ok();
    });

  });

  describe("#on(event, callback)", function() {

    it("should namespace events with `name`", function() {
      var cb = this.save.spy();
      this.remote.name = 'databaseName';
      this.remote.on('funky', cb);

      expect(this.hoodie.on.calledWith('databaseName:funky', cb)).to.be.ok();
    });

    it("should namespace multiple events correctly", function() {
      var cb = this.sandbox.spy();
      this.remote.name = 'databaseName';
      this.remote.on('super funky fresh', cb);
      expect(this.hoodie.on.calledWith('databaseName:super databaseName:funky databaseName:fresh', cb)).to.be.ok();
    });

  });

  describe("#trigger(event, parameters...)", function() {

    it("should namespace events with `name`", function() {
      var cb = this.sandbox.spy();
      this.remote.name = 'databaseName';
      this.remote.trigger('funky', cb);
      expect(this.hoodie.trigger.calledWith('databaseName:funky', cb)).to.be.ok();
    });

  });

});

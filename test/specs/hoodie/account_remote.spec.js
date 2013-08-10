'use strict';

describe('hoodie.remote', function() {

  beforeEach(function() {
    this.hoodie = new Mocks.Hoodie();

    this.sandbox.spy(this.hoodie, 'on');
    this.sandbox.spy(this.hoodie, 'one');
    this.sandbox.spy(this.hoodie, 'unbind');

    this.requestDefer = this.hoodie.defer();

    this.sandbox.stub(this.hoodie, 'request').returns(this.requestDefer.promise());
    this.sandbox.spy(window, 'setTimeout');

    this.sandbox.stub(this.hoodie.account, 'db').returns('userhash123');
    this.sandbox.spy(this.hoodie, 'trigger');
    this.sandbox.spy(this.hoodie, 'checkConnection');

    this.sandbox.stub(this.hoodie.store, 'remove')
    .returns(this.hoodie.resolveWith('objectFromStore'));
    this.sandbox.stub(this.hoodie.store, 'update')
    .returns(this.hoodie.resolveWith('objectFromStore', false));
    this.sandbox.stub(this.hoodie.store, 'save')
    .returns(this.hoodie.resolveWith('objectFromStore', false));

    hoodieRemote(this.hoodie);
    this.remote = this.hoodie.remote;
  });

  xdescribe('defaults', function() {
    it('should set name to users database name', function() {
      expect(this.remote.name).to.eql('userhash123');
    });

    it('should be connected by default', function() {
      expect(this.remote.isConnected()).to.be.ok();
    });

    it('should connect', function() {
      expect(Hoodie.AccountRemote.prototype.connect.called).to.be.ok();
    });
  }); // #defaults

  describe("#loadListOfKnownObjectsFromLocalStore", function() {
    it.skip('should have some specs')
  });
  describe("#subscribeToOutsideEvents", function() {
    it.skip('should have some specs')
  });

  describe('#connect()', function() {
    beforeEach(function() {
      this.authenticateDefer = this.hoodie.defer();
      this.sandbox.spy(this.remote, 'sync')

      this.sandbox.stub(this.hoodie.account, 'authenticate')
      .returns(this.authenticateDefer.promise());
    });

    it('should authenticate', function() {
      this.remote.connect();
      expect(this.hoodie.account.authenticate).to.be.called();
    });

    _when('successfully authenticated', function() {
      beforeEach(function() {
        this.authenticateDefer.resolve();
      });

      it('should set connected to true', function() {
        this.remote.connected = false;
        this.remote.connect();
        expect(this.remote.connected).to.be(true);
      });

      it('should subscribe to store:idle event', function() {
        this.remote.connect();
        expect(this.hoodie.on).calledWith('store:idle', this.remote.push);
      });

      _and('user signs in, it should connect', function() {
        beforeEach(function() {
          this.remote.connected = false;
          this.sandbox.spy(this.remote, 'connect');
          this.remote.subscribeToOutsideEvents();
          this.hoodie.trigger('account:signin');
        });

        it('should connect', function() {
          expect(this.remote.connected).to.eql(true);
        });
      }); // user signs in, it should connect
    }); // successfully authenticated
  }); // #connect

  xdescribe('#disconnect()', function() {

    it('should unsubscribe from stores\'s dirty idle event', function() {
      this.remote.disconnect();
      expect(this.hoodie.unbind.calledWith('store:idle', this.remote.push)).to.be.ok();
    });

    it('should set connected to false', function() {
      this.remote.disconnect();
      expect(this.remote.isConnected()).to.not.be.ok();
    });
  }); // #disconnect

  xdescribe('#getSinceNr()', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie.config, 'get');
    });

    it('should use user\'s config to get since nr', function() {
      this.remote.getSinceNr();
      expect(this.hoodie.config.get.calledWith('_remote.since')).to.be.ok();
    });

    _when('config _remote.since is not defined', function() {
      beforeEach(function() {
        this.hoodie.config.get.returns(0);
      });

      it('should return 0', function() {
        expect(this.remote.getSinceNr()).to.eql(0);
      });

    });
  }); // #getSinceNr

  xdescribe('#setSinceNr(nr)', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie.config, 'set');
    });

    it('should use user\'s config to store since nr persistantly', function() {
      this.remote.setSinceNr(100);
      expect(this.hoodie.config.set.calledWith('_remote.since', 100)).to.be.ok();
    });
  }); // #setSinceNr

  xdescribe('#pull()', function() {

    beforeEach(function() {
      this.remote.connected = true;
      this.sandbox.stub(this.remote, 'request').returns(this.requestDefer.promise());
    });

    _when('.isConnected() is true', function() {

      beforeEach(function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(true);
      });

      it('should send a longpoll GET request to the _changes feed', function() {
        var method, path, _ref;
        this.remote.pull();
        expect(this.remote.request.called).to.be.ok();

        _ref = this.remote.request.mostRecentCall.args,
        method = _ref[0],
        path = _ref[1];

        expect(method).to.eql('GET');
        expect(path).to.eql('/_changes?include_docs=true&since=0&heartbeat=10000&feed=longpoll');
      });

      it('should set a timeout to restart the pull request', function() {
        this.remote.pull();
        expect(window.setTimeout.calledWith(this.remote._restartPullRequest, 25000)).to.be.ok();
      });

    });

    _when('.isConnected() is false', function() {

      beforeEach(function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(false);
      });

      it('should send a normal GET request to the _changes feed', function() {
        var method, path, _ref;
        this.remote.pull();

        expect(this.remote.request.called).to.be.ok();
        _ref = this.remote.request.mostRecentCall.args,
        method = _ref[0],
        path = _ref[1];

        expect(method).to.eql('GET');
        expect(path).to.eql('/_changes?include_docs=true&since=0');
      });

    });

    _when('request is successful / returns changes', function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return success(Mocks.changesResponse());
          }
        });
      });

      _and('.isConnected() returns true', function() {

        beforeEach(function() {
          this.sandbox.stub(this.remote, 'isConnected').returns(true);
          this.sanbox.stub(this.remote, 'pull');
        });

        it('should pull again', function() {
          this.remote.pull();
          expect(this.remote.pull.callCount).to.eql(2);
        });

      });

    });

    _when('request errors with 401 unauthorzied', function() {

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

        this.sanbox.spy(this.remote, 'disconnect');
      });

      it('should disconnect', function() {
        this.remote.pull();
        expect(this.remote.disconnect.called).to.be.ok();
      });

      it('should trigger an unauthenticated error', function() {
        this.sanbox.spy(this.remote, 'trigger');
        this.remote.pull();
        expect(this.remote.trigger.calledWith('error:unauthenticated', 'error object')).to.be.ok();
      });

      _and('remote is pullContinuously', function() {

        beforeEach(function() {
          this.remote.pullContinuously = true;
          this.remote.pullContinuously;
        });

      });

      _and('remote isn\'t pullContinuously', function() {

        beforeEach(function() {
          this.remote.pullContinuously = false;
          this.remote.pullContinuously;
        });

      });

    });

    _when('request errors with 401 unauthorzied', function() {

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

        this.sanbox.spy(this.remote, 'disconnect');
      });

      it('should disconnect', function() {
        this.remote.pull();
        expect(this.remote.disconnect.called).to.be.ok();
      });

      it('should trigger an unauthenticated error', function() {
        this.sandbox.spy(this.remote, 'trigger');
        this.remote.pull();
        expect(this.remote.trigger.calledWith('error:unauthenticated', 'error object')).to.be.ok();
      });

      _and('remote is pullContinuously', function() {

        beforeEach(function() {
          this.remote.pullContinuously = true;
          this.remote.pullContinuously;
        });

      });

      _and('remote isn\'t pullContinuously', function() {

        beforeEach(function() {
          this.remote.pullContinuously = false;
          this.remote.pullContinuously;
        });

      });

    });

    _when('request errors with 404 not found', function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
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

      it('should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)', function() {
        this.remote.pull();
        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
      });

    });

    _when('request errors with 500 oooops', function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
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

      it('should try again in 3 seconds (and hope it was only a hiccup ...)', function() {
        this.remote.pull();
        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
      });

      it('should trigger a server error event', function() {
        this.sandbox.spy(this.remote, 'trigger');
        this.remote.pull();
        expect(this.remote.trigger.calledWith('error:server', 'error object')).to.be.ok();
      });

    });

    _when('request was aborted manually', function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
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

      it('should try again when .isConnected() returns true', function() {
        this.sandbox.stub(this.remote, 'pull');
        this.sandbox.stub(this.remote, 'isConnected').returns(true);

        this.remote.pull();

        expect(this.remote.pull.callCount).to.eql(2);

        this.remote.pull.reset();
        this.remote.isConnected.andReturn(false);
        this.remote.pull();

        expect(this.remote.pull.callCount).to.eql(1);
      });

    });

    _when('there is a different error', function() {

      beforeEach(function() {
        var _this = this;
        this.remote.request.andReturn({
          then: function(success, error) {
            _this.remote.request.andReturn({
              then: function() {}
            });
            return error({}, 'error object');
          }
        });
      });

      it('should try again in 3 seconds if .isConnected() returns false', function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(true);
        this.remote.pull();

        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.be.ok();
        window.setTimeout.reset();

        this.remote.isConnected.andReturn(false);
        this.remote.pull();

        expect(window.setTimeout.calledWith(this.remote.pull, 3000)).to.not.be.ok();
      });

    });
  }); // #pull

  xdescribe('#push(docs)', function() {

    beforeEach(function() {
      this.pushDefer = this.hoodie.defer();
      this.sandbox.stub(Hoodie.Remote.prototype, 'push').returns(this.pushDefer.promise());
    });

    _when('disconnected', function() {

      beforeEach(function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(false);
      });

      it('should reject with pushError', function() {
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

          expect(name).to.eql('ConnectionError');
          expect(message).to.eql('Not connected: could not push local changes to remote');
        });
        expect(errorCalled).to.be.ok();
      });

    });

    _when('connected', function() {

      beforeEach(function() {
        this.sandbox.stub(this.remote, 'isConnected').returns(true);
      });

      _and('no docs passed', function() {

        it('should push changed documents from store', function() {
          this.sandbox.stub(this.hoodie.store, 'changedObjects').returns(['changedDoc']);
          this.remote.push();
          expect(Hoodie.Remote.prototype.push.calledWith(['changedDoc'])).to.be.ok();
        });

      });

      _and('push fails', function() {

        beforeEach(function() {
          this.pushDefer.reject();
        });

        it('should check connection', function() {
          this.remote.push();
          expect(this.hoodie.checkConnection.called).to.be.ok();
        });

      });

    });
  }); // #push

  xdescribe('#on', function() {

    it('should namespace bindings with \'remote\'', function() {
      this.remote.on('funk', 'check');
      expect(this.hoodie.on.calledWith('remote:funk', 'check')).to.be.ok();
    });

    it('should namespace multiple events correctly', function() {
      var cb = this.sandbox.spy();
      this.remote.on('super funky fresh', cb);
      expect(this.hoodie.on.calledWith('remote:super remote:funky remote:fresh', cb)).to.be.ok();
    });
  }); // #on

  xdescribe('#one', function() {

    it('should namespace bindings with \'remote\'', function() {
      this.remote.one('funk', 'check');
      expect(this.hoodie.one.calledWith('remote:funk', 'check')).to.be.ok();
    });

    it('should namespace multiple events correctly', function() {
      var cb = this.sandbox.spy();
      this.remote.one('super funky fresh', cb);
      expect(this.hoodie.one.calledWith('remote:super remote:funky remote:fresh', cb)).to.be.ok();
    });
  }); // #one

  xdescribe('#trigger', function() {
    it('should namespace bindings with \'remote\'', function() {
      this.remote.trigger('funk', 'check');
      expect(this.hoodie.trigger.calledWith('remote:funk', 'check')).to.be.ok();
    });
  }); // #trigger

});

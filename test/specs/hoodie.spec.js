describe('Hoodie', function() {

  'use strict';

  beforeEach(function() {
    this.hoodie = new Hoodie('http://couch.example.com');
    this.ajaxDefer = $.Deferred();

    this.sandbox = sinon.sandbox.create();
    this.noop = function () { };

    var ajaxPromise = this.ajaxDefer.promise();
    ajaxPromise.abort = function() {};

    this.ajaxStub = this.sandbox.stub($, 'ajax').returns(ajaxPromise);

    this.sandbox.stub(window, 'setTimeout').returns(function(cb) {
      return cb;
    });

  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('constructor', function() {

    it('should store the CouchDB URL', function() {
      var hoodie = new Hoodie('http://couch.example.com');
      expect(hoodie.baseUrl).to.eql('http://couch.example.com');
    });

    it('should remove trailing slash from passed URL', function() {
      var hoodie = new Hoodie('http://couch.example.com/');
      expect(hoodie.baseUrl).to.eql('http://couch.example.com');
    });

    it('should default the CouchDB URL to current domain with a api subdomain', function() {
      var hoodie = new window.Hoodie();
      expect(hoodie.baseUrl).to.eql('/_api');
    });

    it('should check connection', function() {
      var hoodie;

      this.sandbox.spy(Hoodie.prototype, 'checkConnection');

      hoodie = new window.Hoodie();
      expect(Hoodie.prototype.checkConnection.called).to.be.ok();
    });

    xit('store has to be initialized before remote', function() {
      var hoodie, order;

      order = [];
      hoodie = this.hoodie;

      this.sandbox.stub(Hoodie, 'AccountRemote').returns(new Mocks.Hoodie().remote);
      this.sandbox.stub(Hoodie, 'LocalStore').returns(new Mocks.Hoodie().store);

      expect(order.join(',')).to.eql('store,remote');
    });

  });

  describe('#request(type, path, options)', function() {

    // see http://bugs.jquery.com/ticket/14104
    it('should return a jQuery.ajax compatible promise', function() {
      var promise = this.hoodie.request('GET', '/');
      expect(promise.abort).to.be.ok();
    });

    _when('request(\'GET\', \'/\')', function() {

      beforeEach(function() {
        var args;
        this.hoodie.request('GET', '/');
        this.args = args = $.ajax.args[0][0];
      });

      it('should send a GET request to http://couch.example.com/', function() {
        expect(this.args.type).to.eql('GET');
        expect(this.args.url).to.eql('http://couch.example.com/');
      });

      it('should set `dataType: \'json\'', function() {
        expect(this.args.dataType).to.eql('json');
      });

      it('should set `xhrFields` to `withCredentials: true`', function() {
        expect(this.args.xhrFields.withCredentials).to.eql(true);
      });
      it('should set `crossDomain: true`', function() {
        expect(this.args.crossDomain).to.eql(true);
      });
    });

    _when('request \'POST\', \'/test\', data: funky: \'fresh\'', function() {

      beforeEach(function() {
        var args;
        this.hoodie.request('POST', '/test', {
          data: {
            funky: 'fresh'
          }
        });
        this.args = args = $.ajax.args[0][0];
      });

      it('should send a POST request to http://couch.example.com/test', function() {
        expect(this.args.type).to.eql('POST');
        expect(this.args.url).to.eql('http://couch.example.com/test');
      });

    });

    _when('request(\'GET\', \'http://api.otherapp.com/\')', function() {

      beforeEach(function() {
        var args;
        this.hoodie.request('GET', 'http://api.otherapp.com/');
        this.args = args = $.ajax.args[0][0];
      });

      it('should send a GET request to http://api.otherapp.com/', function() {
        expect(this.args.type).to.eql('GET');
        expect(this.args.url).to.eql('http://api.otherapp.com/');
      });

    });

    _when('request fails with empty response', function() {

      beforeEach(function() {
        this.ajaxDefer.reject({
          xhr: {
            responseText: ''
          }
        });
      });

      it('should return a rejected promis with Cannot reach backend error', function() {
        this.hoodie.request('GET', '/').then(this.noop, function (res) {
          expect(res).to.eql({
            error: 'Cannot connect to Hoodie server at http://couch.example.com'
          });
        });
      });

    });

  });

  describe('#checkConnection()', function() {

    beforeEach(function() {
      this.requestDefer = this.hoodie.defer();
      this.hoodie._checkConnectionRequest = null;

      this.sandbox.stub(this.hoodie, 'request').returns(this.requestDefer.promise());
      this.sandbox.stub(this.hoodie, 'trigger');
      window.setTimeout.returns(null);
    });

    it('should send GET / request', function() {
      this.hoodie.checkConnection();
      expect(this.hoodie.request.calledWith('GET', '/')).to.be.ok();
    });

    it('should only send one request at a time', function() {
      this.hoodie.checkConnection();
      this.hoodie.checkConnection();
      expect(this.hoodie.request.callCount).to.eql(1);
    });

    _when('hoodie is online', function() {

      beforeEach(function() {
        this.hoodie.online = true;
      });

      _and('request succeeds', function() {

        beforeEach(function() {
          this.requestDefer.resolve({
            'couchdb': "Welcome",
            'version': "1.2.1"
          });
          this.hoodie.checkConnection();
        });

        it('should check again in 30 seconds', function() {
          expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 30000)).to.be.ok();
        });

        it('should not trigger `reconnected` event', function() {
          expect(this.hoodie.trigger.calledWith('reconnected')).to.not.be.ok();
        });

      });

      _and('request fails', function() {

        beforeEach(function() {
          this.requestDefer.reject({
            'status': 0,
            'statusText': "Error"
          });
          this.hoodie.checkConnection();
        });

        it('should check again in 3 seconds', function() {
          expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 3000)).to.be.ok();
        });

        it('should trigger `disconnected` event', function() {
          expect(this.hoodie.trigger.calledWith('disconnected')).to.be.ok();
        });

      });

    });

    _when('hoodie is offline', function() {

      beforeEach(function() {
        this.hoodie.online = false;
      });

      _and('request succeeds', function() {

        beforeEach(function() {
          this.requestDefer.resolve({
            'couchdb': "Welcome",
            'version': "1.2.1"
          });
          this.hoodie.checkConnection();
        });

        it('should check again in 30 seconds', function() {
          expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 30000)).to.be.ok();
        });

        it('should trigger `reconnected` event', function() {
          expect(this.hoodie.trigger.calledWith('reconnected')).to.be.ok();
        });

      });

      _and('request fails', function() {

        beforeEach(function() {
          this.requestDefer.reject({
            'status': 0,
            'statusText': "Error"
          });
          this.hoodie.checkConnection();
        });

        it('should check again in 3 seconds', function() {
          expect(window.setTimeout.calledWith(this.hoodie.checkConnection, 3000)).to.be.ok();
        });

        it('should not trigger `disconnected` event', function() {
          expect(this.hoodie.trigger.calledWith('disconnected')).to.not.be.ok();
        });

      });

    });

  });

  describe('#open(store, options)', function() {

    it('should instantiate a Remote instance', function() {

      this.sandbox.spy(Hoodie, 'Remote');

      this.hoodie.open('store_name', {
        option: 'value'
      });
      expect(Hoodie.Remote.calledWith(this.hoodie, {
        name: 'store_name',
        option: 'value'
      })).to.be.ok();
    });

  });

  describe('#uuid(num = 7)', function() {

    it('should default to a length of 7', function() {
      expect(this.hoodie.uuid().length).to.eql(7);
    });

    _when('called with num = 5', function() {

      it('should generate an id with length = 5', function() {
        expect(this.hoodie.uuid(5).length).to.eql(5);
      });

    });

  });

  describe('#isPromise(object)', function() {

    it('should return true if object is a promise', function() {
      var object = $.Deferred().promise();
      expect(this.hoodie.isPromise(object)).to.be.ok();
    });

    it('should return false for deferred objects', function() {
      var object = $.Deferred();
      expect(this.hoodie.isPromise(object)).to.not.be.ok();
    });

    it('should return false when object is undefined', function() {
      expect(this.hoodie.isPromise(void 0)).to.not.be.ok();
    });

  });

  describe('#resolve()', function() {

    it('simply returns resolved promise', function() {
      expect(this.hoodie.resolve().state()).to.eql('resolved');
    });

    it('should be applyable', function() {
      var promise = this.hoodie.reject().then(null, this.hoodie.resolve);
      expect(promise.state()).to.eql('resolved');
    });

  });

  describe('#reject()', function() {

    it('simply returns rejected promise', function() {
      expect(this.hoodie.reject().state()).to.eql('rejected');
    });

    it('should be applyable', function() {
      var promise = this.hoodie.resolve().then(this.hoodie.reject);
      expect(promise.state()).to.eql('rejected');
    });

  });

  describe('#resolveWith(something)', function() {

    it('wraps passad arguments into a promise and returns it', function() {
      var promise = this.hoodie.resolveWith('funky', 'fresh');

      promise.then(function (a, b) {
        expect(a, b).to.eql('funky', 'fresh');
      });

    });

    it('should be applyable', function() {
      var promise = this.hoodie.rejectWith(1, 2).then(null, this.hoodie.resolveWith);
      promise.then(function (a, b) {
        expect(a, b).to.eql('1', '2');
      });
    });

  });

  describe('#rejectWith(something)', function() {

    it('wraps passad arguments into a promise and returns it', function() {
      var promise = this.hoodie.rejectWith('funky', 'fresh');

      promise.then(this.noop, function (a, b) {
        expect(a, b).to.eql('funky', 'fresh');
      });

    });

    it('should be applyable', function() {
      var promise = this.hoodie.resolveWith(1, 2).then(this.hoodie.rejectWith);
      promise.then(this.noop, function (a, b) {
        expect(a, b).to.eql('1', '2');
      });
    });

  });

  describe('#dispose()', function() {
    beforeEach(function() {
      this.sandbox.spy(this.hoodie, 'trigger');
    });

    it('should trigger `dispose` event', function() {
      this.hoodie.dispose();
      expect(this.hoodie.trigger.calledWith('dispose')).to.be.ok();
    });
  });

});

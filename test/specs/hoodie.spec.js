describe('Hoodie', function() {

  'use strict';

  beforeEach(function() {
    this.ajaxDefer = $.Deferred();
    var ajaxPromise = this.ajaxDefer.promise();
    ajaxPromise.abort = function() {};
    this.ajaxStub = this.sandbox.stub($, 'ajax').returns(ajaxPromise);

    this.sandbox.stub(window, 'setTimeout').returns(function(cb) {
      return cb;
    });

    this.noop = function () { };

    this.hoodie = new Hoodie('http://couch.example.com');
  });

  afterEach(function () {
    this.hoodie = null;
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
      var hoodie = new Hoodie();
      expect(hoodie.baseUrl).to.eql('/_api');
    });


    // TODO: get rid of this, smells
    it.skip('store has to be initialized before remote', function() {
      var hoodie, order;

      order = [];
      hoodie = this.hoodie;

      this.sandbox.stub(Hoodie, 'AccountRemote').returns(new Mocks.Hoodie().remote);
      this.sandbox.stub(Hoodie, 'LocalStore').returns(new Mocks.Hoodie().store);

      expect(order.join(',')).to.eql('store,remote');
    });

    it("should set request method", function() {
      expect(typeof this.hoodie.request).to.eql('function');
    });
    it("should set checkConnection method", function() {
      expect(typeof this.hoodie.checkConnection).to.eql('function');
    });
    it("should set isOnline method", function() {
      expect(typeof this.hoodie.isOnline).to.eql('function');
    });

    it("should set uuid method", function() {
      expect(typeof this.hoodie.uuid).to.eql('function');
    });
    it("should set dispose method", function() {
      expect(typeof this.hoodie.dispose).to.eql('function');
    });

    it("should set isPromise method", function() {
      expect(typeof this.hoodie.isPromise).to.eql('function');
    });
    it("should set resolve method", function() {
      expect(typeof this.hoodie.resolve).to.eql('function');
    });
    it("should set resolveWith method", function() {
      expect(typeof this.hoodie.resolveWith).to.eql('function');
    });
    it("should set reject method", function() {
      expect(typeof this.hoodie.reject).to.eql('function');
    });
    it("should set rejectWith method", function() {
      expect(typeof this.hoodie.rejectWith).to.eql('function');
    });

    it.skip("should check for a pending checkPasswordReset");

    it.skip("should authenticate");
  });
});

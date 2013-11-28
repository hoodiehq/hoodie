/* globals Hoodie:true */


var Hoodie = require('../../src/hoodie');

describe('Hoodie', function() {

  'use strict';

  beforeEach(function() {

    var hoodie = new Hoodie('http://couch.example.com');


    var hoodieEvents = this.MOCKS.events.apply(this);
    var hoodieAccount = this.MOCKS.account.apply(this);
    var hoodieConfig = this.MOCKS.config.apply(this);
    //var hoodieConnection = this.MOCKS.connnection.apply(this);
    var hoodieDispose = this.MOCKS.dispose.apply(this);
    var hoodieGenerateId = this.MOCKS.generate_id.apply(this);
    var hoodieOpen = this.MOCKS.open.apply(this);
    var hoodiePromises = this.MOCKS.promises.apply(this);
    var hoodieRemoteStore = this.MOCKS.remote_store.apply(this);
    var hoodieRequest = this.MOCKS.request.apply(this);
    var hoodieStore = this.MOCKS.store.apply(this);
    var hoodieTask = this.MOCKS.task.apply(this);

    // stubbing all the modules
    this.sandbox.stub(hoodie, 'on', hoodieEvents.on);
    this.sandbox.stub(hoodie, 'off', hoodieEvents.off);
    this.sandbox.stub(hoodie, 'bind', hoodieEvents.bind);
    this.sandbox.stub(hoodie, 'trigger', hoodieEvents.trigger);
    this.sandbox.stub(global, 'hoodiePromises', hoodiePromises);
    this.sandbox.stub(global, 'hoodieRequest', hoodieRequest);
    //this.sandbox.stub(global, 'hoodieConnection', hoodieConnection);
    this.sandbox.stub(global, 'hoodieGenerateId', hoodieGenerateId);
    this.sandbox.stub(global, 'hoodieDispose', hoodieDispose);
    this.sandbox.stub(global, 'hoodieOpen', hoodieOpen);
    this.sandbox.stub(global, 'hoodieStore', hoodieStore);
    this.sandbox.stub(global, 'hoodieTask', hoodieTask);
    this.sandbox.stub(global, 'hoodieConfig', hoodieConfig);
    this.sandbox.stub(global, 'hoodieAccount', hoodieAccount);
    this.sandbox.stub(global, 'hoodieRemoteStore', hoodieRemoteStore);
    this.sandbox.spy(global, 'addEventListener');

  });

  describe('new Hoodie(baseUrl)', function() {
    it('should store the base url', function() {
      var hoodie = new Hoodie('http://couch.example.com');
      expect(hoodie.baseUrl).to.eql('http://couch.example.com');
    });

    it('should remove trailing slash from passed URL', function() {
      var hoodie = new Hoodie('http://couch.example.com/');
      expect(hoodie.baseUrl).to.eql('http://couch.example.com');
    });

    it('should default the CouchDB URL to current domain with a api subdomain', function() {
      var hoodie = new Hoodie();
      expect(hoodie.baseUrl).to.be( undefined );
    });

    // test for extending with core modules
    //it('should extend with hoodieEvents module', function() {
      //expect(window.hoodieEvents).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodiePromises module', function() {
      //expect(global.hoodiePromises).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieRequest module', function() {
      //expect(global.hoodieRequest).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieConnection module', function() {
      //expect(global.hoodieConnection).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieGenerateId module', function() {
      //expect(global.hoodieGenerateId).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieDispose module', function() {
      //expect(global.hoodieDispose).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieOpen module', function() {
      //expect(global.hoodieOpen).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieStore module', function() {
      //expect(global.hoodieStore).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieConfig module', function() {
      //expect(global.hoodieConfig).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieAccount module', function() {
      //expect(global.hoodieAccount).to.be.calledWith(this.hoodie);
    //});
    //it('should extend with hoodieRemoteStore module', function() {
      //expect(global.hoodieRemoteStore).to.be.calledWith(this.hoodie);
    //});

    //// initializations

    //it('presets hoodie.account.username', function() {
      //expect(this.hoodie.config.get).calledWith('_account.username');
      //expect(this.hoodie.account.username).to.be('_account.username');
    //});

    //it('checks for a pending password reset', function() {
      //expect(this.hoodie.account.checkPasswordReset).to.be.called();
    //});

    //it('authenticates', function() {
      //expect(this.hoodie.account.authenticate).to.be.called();
    //});

    //it('clears store on signup', function() {
      //expect(this.hoodie.on).to.be.calledWith('account:signout', this.hoodie.config.clear);
    //});

    //it('inits store module', function() {
      //expect(this.hoodie.store.patchIfNotPersistant).to.be.called();
      //expect(this.hoodie.store.subscribeToOutsideEvents).to.be.called();
      //expect(this.hoodie.store.bootstrapDirtyObjects).to.be.called();
    //});

    //it('inits task module', function() {
      //expect(this.hoodie.task.subscribeToOutsideEvents).to.be.called();
    //});

    //it('inits remote module', function() {
      //expect(this.hoodie.remote.subscribeToOutsideEvents).to.be.called();
    //});

    //it('connects to remote when authenticate succeeds', function() {
      //expect(this.hoodie.remote.connect).to.not.be.called();
      //this.hoodie.account.authenticateDefer.resolve('joe@example.com');
      //expect(this.hoodie.remote.connect).to.be.called();

      //expect(this.hoodie.remote.connect).to.not.be.calledWith('joe@example.com');
      //// ... because it would set the remote store name to 'joe@example.com'
      ////     which is not correct. The remote store is 'user/<hash>'
    //});

    it('checks connection when user goes offline', function() {
      expect(global.addEventListener).to.be.calledWith('offline', this.hoodie.checkConnection, false);
    });

    //it('checks connection when user goes online', function() {
      //expect(global.addEventListener).to.be.calledWith('online', this.hoodie.checkConnection, false);
    //});

    //it('checks connection', function() {
      //expect(this.hoodie.checkConnection).to.be.called();
    //});

  });

  //describe('Hoodie.extend', function() {
    //it('should init extensions on initialization', function() {
      //var extension = sinon.spy();
      //Hoodie.extend( extension );
      //var hoodie = new Hoodie();
      //expect(extension).to.be.calledWith(hoodie);
    //});
  //});

});

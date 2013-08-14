describe('Hoodie', function() {

  'use strict';

  beforeEach(function() {

    // stubbing all the modules
    this.sandbox.stub(window, 'hoodieEvents', Mocks.hoodieEvents);
    this.sandbox.stub(window, 'hoodiePromises', Mocks.hoodiePromises);
    this.sandbox.stub(window, 'hoodieRequest', Mocks.hoodieRequest);
    this.sandbox.stub(window, 'hoodieConnection', Mocks.hoodieConnection);
    this.sandbox.stub(window, 'hoodieUUID', Mocks.hoodieUUID);
    this.sandbox.stub(window, 'hoodieDispose', Mocks.hoodieDispose);
    this.sandbox.stub(window, 'hoodieOpen', Mocks.hoodieOpen);
    this.sandbox.stub(window, 'hoodieStore', Mocks.hoodieStore);
    this.sandbox.stub(window, 'hoodieConfig', Mocks.hoodieConfig);
    this.sandbox.stub(window, 'hoodieAccount', Mocks.hoodieAccount);
    this.sandbox.stub(window, 'hoodieRemote', Mocks.hoodieRemote);

    this.hoodie = new Hoodie('http://couch.example.com');
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
      expect(hoodie.baseUrl).to.eql('/_api');
    });

    // test for extending with core modules
    it('should extend with hoodieEvents module', function() {
      expect(window.hoodieEvents).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodiePromises module', function() {
      expect(window.hoodiePromises).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieRequest module', function() {
      expect(window.hoodieRequest).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieConnection module', function() {
      expect(window.hoodieConnection).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieUUID module', function() {
      expect(window.hoodieUUID).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieDispose module', function() {
      expect(window.hoodieDispose).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieOpen module', function() {
      expect(window.hoodieOpen).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieStore module', function() {
      expect(window.hoodieStore).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieConfig module', function() {
      expect(window.hoodieConfig).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieAccount module', function() {
      expect(window.hoodieAccount).to.be.calledWith(this.hoodie);
    });
    it('should extend with hoodieRemote module', function() {
      expect(window.hoodieRemote).to.be.calledWith(this.hoodie);
    });

    // initializations

    it('presets hoodie.account.username', function() {
      expect(this.hoodie.config.get).calledWith('_account.username');
      expect(this.hoodie.account.username).to.be('_account.username');
    });
    it('presets hoodie.account.ownerHash', function() {
      expect(this.hoodie.config.get).calledWith('_account.ownerHash');
      expect(this.hoodie.account.ownerHash).to.be('_account.ownerHash');
    });

    it('checks for a pending password reset', function() {
      expect(this.hoodie.account.checkPasswordReset).to.be.called();
    });

    it('authenticates', function() {
      expect(this.hoodie.account.authenticate).to.be.called();
    });

    it('clears store on signup', function() {
      expect(this.hoodie.on).to.be.calledWith('account:signout', this.hoodie.config.clear);
    });

    it('inits store', function() {
      expect(this.hoodie.store.patchIfNotPersistant).to.be.called();
      expect(this.hoodie.store.subscribeToOutsideEvents).to.be.called();
      expect(this.hoodie.store.bootstrapDirtyObjects).to.be.called();
    });

    it('inits remote', function() {
      expect(this.hoodie.remote.subscribeToEvents).to.be.called();
    });

    it('connects to remote when authenticate succeeds', function() {
      expect(this.hoodie.remote.connect).to.not.be.called();
      this.hoodie.account.authenticateDefer.resolve();
      expect(this.hoodie.remote.connect).to.be.called();
    });
  });

  describe('Hoodie.extend', function() {
    it('should init extenseions on initialization', function() {
      var extension = sinon.spy();
      Hoodie.extend( extension );
      var hoodie = new Hoodie()
      expect(extension).to.be.calledWith(hoodie)
    })
  });
});

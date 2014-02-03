require('../../lib/setup');
var hoodieConnection = require('../../../src/hoodie/connection');

describe('#checkConnection()', function() {

  beforeEach(function() {
    this.hoodie = this.MOCKS.hoodie.apply(this);

    this.sandbox.stub(global, 'setTimeout').returns('checkTimeout');
    this.sandbox.stub(global, 'clearTimeout');

    hoodieConnection(this.hoodie);
  });

  it('should have a checkConnection method', function () {
    expect(this.hoodie).to.have.property('checkConnection');
  });

  it('should have a isConnected method', function () {
    expect(this.hoodie).to.have.property('isConnected');
  });

  it('should send GET / request', function() {
    this.hoodie.checkConnection();
    expect(this.hoodie.request).to.be.calledWith('GET', '/');
  });

  it('should only send one request at a time', function() {
    this.hoodie.checkConnection();
    this.hoodie.checkConnection();
    expect(this.hoodie.request.callCount).to.eql(1);
  });

  _when('hoodie is online', function() {

    beforeEach(function() {
      this.sandbox.stub(this.hoodie, 'isConnected').returns(true);
    });

    _and('request succeeds', function() {

      beforeEach(function() {
        this.hoodie.request.defer.resolve({
          'couchdb': 'Welcome',
          'version': '1.2.1'
        });
        this.hoodie.checkConnection();
      });

      it('should check again in 30 seconds', function() {
        expect(global.setTimeout).to.be.calledWith(this.hoodie.checkConnection, 30000);
      });

      it('should not trigger `reconnected` event', function() {
        expect(this.hoodie.trigger.calledWith('reconnected')).to.not.be.ok();
      });

      it('should cancel running timeout when checked again', function() {
        expect(global.setTimeout.callCount).to.eql(1);
        this.hoodie.checkConnection();
        expect(global.setTimeout.callCount).to.eql(2);
        expect(global.clearTimeout).to.be.calledWith('checkTimeout');
      });
    });

    _and('request fails', function() {

      beforeEach(function() {
        this.hoodie.request.defer.reject({
          'status': 0,
          'statusText': 'Error'
        });
        this.hoodie.checkConnection();
      });

      // skipping these because they seem to cause strange error:
      // the string 'TypeError: 'undefined' is not an object (evaluating 'hoodie.request('GET', '/').then')' was thrown, throw an Error :)
      it('should check again in 3 seconds', function() {
        expect(global.setTimeout).to.be.calledWith(this.hoodie.checkConnection, 3000);
      });

      it('should trigger `disconnected` event', function() {
        expect(this.hoodie.trigger.calledWith('disconnected')).to.be.ok();
      });

      it('should cancel running timeout when checked again', function() {
        expect(global.setTimeout.callCount).to.eql(1);
        this.hoodie.checkConnection();
        expect(global.setTimeout.callCount).to.eql(2);
        expect(global.clearTimeout).to.be.calledWith('checkTimeout');
      });
    });
  });

  _when('hoodie is offline', function() {

    beforeEach(function() {
      this.sandbox.stub(this.hoodie, 'isConnected').returns(false);
    });

    _and('request succeeds', function() {

      beforeEach(function() {
        this.hoodie.request.defer.resolve({
          'couchdb': 'Welcome',
          'version': '1.2.1'
        });
        this.hoodie.checkConnection();
      });

      it('should check again in 30 seconds', function() {
        expect(global.setTimeout).to.be.calledWith(this.hoodie.checkConnection, 30000);
      });

      it('should trigger `reconnected` event', function() {
        expect(this.hoodie.trigger).to.be.calledWith('reconnected');
      });

    });

    _and('request fails', function() {

      beforeEach(function() {
        this.hoodie.request.defer.reject({
          'status': 0,
          'statusText': 'Error'
        });
        this.hoodie.checkConnection();
      });

      it('should check again in 3 seconds', function() {
        expect(global.setTimeout).to.be.calledWith(this.hoodie.checkConnection, 3000);
      });

      it('should not trigger `disconnected` event', function() {
        expect(this.hoodie.trigger).to.not.be.calledWith('disconnected');
      });

    });

  });

});


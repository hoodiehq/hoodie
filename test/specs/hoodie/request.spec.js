/* global hoodieRequest:true */

describe('hoodie.request', function () {

  'use strict';

  beforeEach(function () {

    this.hoodie = new Mocks.Hoodie();
    this.ajaxDefer = this.hoodie.defer();
    var ajaxPromise = this.ajaxDefer.promise();
    ajaxPromise.abort = function() {};
    this.sandbox.stub(window.jQuery, 'ajax').returns(ajaxPromise);

    hoodieRequest(this.hoodie);
    this.requestDefer = this.hoodie.defer();
  });

  // see http://bugs.jquery.com/ticket/14104
  it('should return a jQuery.ajax compatible promise', function() {
    var promise = this.hoodie.request('GET', '/');
    expect(promise).to.be.promise();
    expect(promise).to.have.property('abort');
  });

  _when('request(\'GET\', \'/\')', function() {
    beforeEach(function() {
      this.hoodie.request('GET', '/');
      this.args = window.jQuery.ajax.args[0][0];
    });
    it('should send a GET request to http://my.cou.ch/', function() {
      expect(this.args.type).to.be('GET');
      expect(this.args.url).to.be('http://my.cou.ch/');
    });
    it('should set `dataType: \'json\'', function() {
      expect(this.args.dataType).to.be('json');
    });
    it('should set `xhrFields` to `withCredentials: true`', function() {
      expect(this.args.xhrFields.withCredentials).to.be(true);
    });
    it('should set `crossDomain: true`', function() {
      expect(this.args.crossDomain).to.be(true);
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
      this.args = args = window.jQuery.ajax.args[0][0];
    });
    it('should send a POST request to http://my.cou.ch/test', function() {
      expect(this.args.type).to.be('POST');
      expect(this.args.url).to.be('http://my.cou.ch/test');
    });
  });

  _when('request(\'GET\', \'http://api.otherapp.com/\')', function() {
    beforeEach(function() {
      var args;
      this.hoodie.request('GET', 'http://api.otherapp.com/');
      this.args = args = window.jQuery.ajax.args[0][0];
    });
    it('should send a GET request to http://api.otherapp.com/', function() {
      expect(this.args.type).to.be('GET');
      expect(this.args.url).to.be('http://api.otherapp.com/');
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
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        error: 'Cannot connect to Hoodie server at http://my.cou.ch'
      });
    });
  });
});

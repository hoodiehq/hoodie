require('../../lib/setup');
var hoodieRequest = require('../../../src/utils/request');

describe('hoodie.request', function () {

  'use strict';

  beforeEach(function () {
    this.hoodie = this.MOCKS.hoodie.apply(this);
    this.ajaxDefer = this.hoodie.defer();
    var ajaxPromise = this.ajaxDefer.promise();
    ajaxPromise.abort = function() {};
    this.sandbox.stub(global.jQuery, 'ajax').returns(ajaxPromise);

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
      this.args = global.jQuery.ajax.args[0][0];
    });
    it('should send a GET request to https://my.hood.ie/_api/', function() {
      expect(this.args.type).to.be('GET');
      expect(this.args.url).to.be('https://my.hood.ie/_api/');
    });
    it('should set `dataType: \'json\'', function() {
      expect(this.args.dataType).to.be('json');
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

    _and('baseUrl is not set', function() {
      beforeEach(function() {
        this.hoodie.baseUrl = undefined;
        hoodieRequest(this.hoodie);
        this.hoodie.request('GET', '/');
        this.args = global.jQuery.ajax.args[1][0];
      });

      it('should send a GET request prefixed by /_api', function() {
        expect(this.args.type).to.be('GET');
        expect(this.args.url).to.be('/_api/');
      });

      it('should not set CORS headers', function() {
        expect(this.args.xhrFields).to.be(undefined);
        expect(this.args.crossDomain).to.be(undefined);
      });
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
      this.args = args = global.jQuery.ajax.args[0][0];
    });
    it('should send a POST request to https://my.hood.ie/_api/test', function() {
      expect(this.args.type).to.be('POST');
      expect(this.args.url).to.be('https://my.hood.ie/_api/test');
    });
  });

  _when('request(\'GET\', \'http://api.otherapp.com/\')', function() {
    beforeEach(function() {
      var args;
      this.hoodie.request('GET', 'http://api.otherapp.com/');
      this.args = args = global.jQuery.ajax.args[0][0];
    });
    it('should send a GET request to http://api.otherapp.com/', function() {
      expect(this.args.type).to.be('GET');
      expect(this.args.url).to.be('http://api.otherapp.com/');
    });
  });
  _when('request fails with empty response', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        responseText: ''
      });
    });
    it('should return a rejected promis with Cannot reach backend error', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieConnectionError',
        message: 'Could not connect to Hoodie server at {{url}}.',
        url: 'https://my.hood.ie'
      });
    });
  });


  _when('request fails with 400', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 400,
        responseText: '{"reason": "funky"}'
      });
    });
    it('should return rejected with a HoodieRequestError', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieRequestError',
        message: 'Funky',
        status: 400
      });
    });
  });
  _when('request fails with 401', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 401,
        responseText: '{"reason": "funky"}'
      });
    });
    it('should return rejected with a HoodieUnauthorizedError', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieUnauthorizedError',
        message: 'Funky',
        status: 401
      });
    });
  });

  _when('request fails with 403', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 403,
        responseText: '{"reason": "funky"}'
      });
    });
    it('should return rejected with a HoodieRequestError', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieRequestError',
        message: 'Funky',
        status: 403
      });
    });
  });

  _when('request fails with 409', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 409,
        responseText: '{"reason": "funky"}'
      });
    });
    it('should return rejected with a HoodieConflictError', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieConflictError',
        message: 'Funky',
        status: 409
      });
    });
  });

  _when('request fails with 412', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 412,
        responseText: '{"reason": "funky"}'
      });
    });
    it('should return rejected with a HoodieConflictError', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieConflictError',
        message: 'Funky',
        status: 412
      });
    });
  });

  _when('request fails with 500', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 500,
        responseText: '{"reason": "funky"}'
      });
    });
    it('should return rejected with a HoodieServerError', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieServerError',
        message: 'Funky',
        status: 500
      });
    });
  });

  _when('request fails with unknown error code', function() {
    beforeEach(function() {
      this.ajaxDefer.reject({
        status: 123,
        responseText: '{"error":"funky_stuff", "reason": "funky"}'
      });
    });
    it('should return rejected with a proper Hoodie Error', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieFunkyStuffError',
        message: 'Funky',
        status: 123
      });
    });
  });

});

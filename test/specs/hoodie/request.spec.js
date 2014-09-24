require('../../lib/setup');
var hoodieRequest = require('../../../src/hoodie/request');

describe('request()', function() {
  it('should return promise', function() {
    var promise = hoodieRequest.request({});
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

    it('should set the Authorization "Bearer ..." header', function() {
      expect(this.args.headers.Authorization).to.be('Bearer dXNlci2Mjow9N2Rh2WyZfioB1ubE');
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
    it('should return a rejected promise with Cannot reach backend error', function() {
      expect(this.hoodie.request('GET', '/')).to.be.rejectedWith({
        name: 'HoodieConnectionError',
        message: 'Could not connect to Hoodie server at https://my.hood.ie.',
        url: 'https://my.hood.ie'
      });
    });
  });
});

describe('handleRequestError()', function() {
  it('should reject', function() {
    var promise = hoodieRequest.handleRequestError({},{
      responseText: 'foo'
    });
    expect(promise).to.be.promise();
    expect(promise).to.be.rejected();

    promise = hoodieRequest.handleRequestError({});
    expect(promise).to.be.promise();
    expect(promise).to.be.rejected();
  });
});

describe('parseErrorFromResponse()', function() {
  it('should parse xhr response', function() {
    var xhr = {
      status: 500,
      responseText: JSON.stringify({reason: 'foop'})
    };

    var error = hoodieRequest.parseErrorFromResponse(xhr);

    expect(error.message).to.be('Foop');
    expect(error.status).to.be(xhr.status);
    expect(error.name).to.be(hoodieRequest.HTTP_STATUS_ERROR_MAP[xhr.status]);

    expect(error.error).to.be(undefined);
    expect(error.reason).to.be(undefined);
  });
});

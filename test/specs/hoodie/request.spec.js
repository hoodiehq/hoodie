require('../../lib/setup');
var hoodieRequest = require('../../../src/hoodie/request');

describe('request()', function() {
  it('should return promise', function() {
    var promise = hoodieRequest.request({});
    expect(promise).to.be.promise();
    expect(promise.abort).to.be.a(Function);
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

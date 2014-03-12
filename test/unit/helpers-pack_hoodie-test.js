var path = require('path');
var Stream = require('stream');
var expect = require('expect.js');
var hoodiejs = require('../../lib/helpers/pack_hoodie');
var _ = require('lodash');

describe('pack_hoodie', function () {

  // Dummy config object with plugins attribute.
  var config = { app: {}, plugins: [] };

  it('should be a function', function () {
    expect(hoodiejs).to.be.a(Function);
  });

  it('should return a readable stream on empty cache', function (done) {
    var stream = hoodiejs(config);

    expect(stream).to.be.a(Stream);
    expect(stream.readable).to.be(true);

    var chunks = [];
    stream.on('data', function (buf) {
      chunks.push(buf);
    });
    stream.on('end', function () {
      var js = chunks.join('');
      expect(/hoodie_bundle\.js/.test(js)).to.be(true);
      done();
    });
  });

  it('should return a cached string after first request', function () {
    var str = hoodiejs(config);
    expect(str).to.be.a('string');
    expect(/hoodie_bundle\.js/.test(str)).to.be(true);
  });

});
